"""
🔒 Auth Service - Sistema di Autenticazione Moderno per commIT
Gestisce registrazione, login, tokens e sessioni
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from bson import ObjectId

from database import mongodb
from database_schema import UserType

# Setup logging
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Short-lived
REFRESH_TOKEN_EXPIRE_DAYS = 30    # Long-lived


class AuthService:
    """
    Servizio centralizzato per tutte le operazioni di autenticazione
    """
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password con bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifica password"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Crea access token JWT (short-lived)
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """
        Crea refresh token JWT (long-lived)
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({
            "exp": expire,
            "type": "refresh"
        })
        
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """
        Decodifica e valida un token JWT
        """
        try:
            payload = jwt.decode(
                token,
                JWT_SECRET_KEY,
                algorithms=[JWT_ALGORITHM]
            )
            return payload
        except JWTError as e:
            logger.error(f"JWT decode error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    async def register_user(
        email: str,
        password: str,
        full_name: str,
        user_type: UserType,
        **extra_data
    ) -> Dict[str, Any]:
        """
        Registra un nuovo utente nel sistema
        
        Returns:
            Dict contenente i dati dell'utente creato
        """
        try:
            # 1. Verifica che email non esista già
            existing_user = await AuthService.find_user_by_email(email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email già registrata"
                )
            
            # 2. Hash password
            hashed_password = AuthService.hash_password(password)
            
            # 3. Prepara documento utente
            user_doc = {
                "email": email,
                "password": hashed_password,
                "full_name": full_name,
                "user_type": user_type.value,
                "is_active": True,
                "email_verified": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # 4. Aggiungi dati extra basati sul tipo utente
            if user_type == UserType.CUSTOMER:
                user_doc.update({
                    "phone": extra_data.get("phone"),
                    "preferences": extra_data.get("preferences", {}),
                    "favorite_providers": [],
                    "total_bookings": 0
                })
                collection_name = "users"
                
            elif user_type == UserType.PROVIDER:
                user_doc.update({
                    "business_name": extra_data.get("business_name"),
                    "phone": extra_data.get("phone"),
                    "service_category": extra_data.get("service_category"),
                    "description": extra_data.get("description", ""),
                    "address": extra_data.get("address", {}),
                    "vat_number": extra_data.get("vat_number"),
                    "business_hours": extra_data.get("business_hours", []),
                    "services_offered": extra_data.get("services_offered", []),
                    "accepts_online_bookings": True,
                    "rating": 0.0,
                    "total_reviews": 0,
                    "tags": extra_data.get("tags", [])
                })
                collection_name = "providers"
            
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User type non valido: {user_type}"
                )
            
            # 5. Inserisci nel database
            collection = mongodb.get_collection(collection_name)
            result = await collection.insert_one(user_doc)
            
            # 6. Prepara risposta (rimuovi password)
            user_doc["_id"] = str(result.inserted_id)
            user_doc.pop("password", None)
            
            logger.info(f"✅ Nuovo utente registrato: {email} ({user_type.value})")
            
            return user_doc
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Errore registrazione utente: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Errore durante la registrazione: {str(e)}"
            )
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Autentica un utente con email e password
        
        Returns:
            Dict con i dati utente se autenticazione successful, None altrimenti
        """
        try:
            # 1. Trova utente
            user = await AuthService.find_user_by_email(email)
            
            if not user:
                logger.warning(f"⚠️ Tentativo login con email non esistente: {email}")
                return None
            
            # 2. Verifica password
            if not AuthService.verify_password(password, user.get("password", "")):
                logger.warning(f"⚠️ Password errata per: {email}")
                return None
            
            # 3. Verifica che account sia attivo
            if not user.get("is_active", False):
                logger.warning(f"⚠️ Tentativo login su account disattivato: {email}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account disattivato"
                )
            
            # 4. Rimuovi password dalla risposta
            user.pop("password", None)
            
            # 5. Converti ObjectId
            if "_id" in user:
                user["_id"] = str(user["_id"])
            
            logger.info(f"✅ Login successful: {email}")
            
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Errore autenticazione: {e}")
            return None
    
    @staticmethod
    async def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """
        Cerca un utente per email in entrambe le collezioni
        """
        try:
            # Cerca in users
            users_collection = mongodb.get_collection("users")
            user = await users_collection.find_one({"email": email})
            
            if user:
                return user
            
            # Cerca in providers
            providers_collection = mongodb.get_collection("providers")
            provider = await providers_collection.find_one({"email": email})
            
            return provider
            
        except Exception as e:
            logger.error(f"❌ Errore ricerca utente: {e}")
            return None
    
    @staticmethod
    async def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Cerca un utente per ID in entrambe le collezioni
        """
        try:
            obj_id = ObjectId(user_id)
            
            # Cerca in users
            users_collection = mongodb.get_collection("users")
            user = await users_collection.find_one({"_id": obj_id})
            
            if user:
                user["_id"] = str(user["_id"])
                user.pop("password", None)
                return user
            
            # Cerca in providers
            providers_collection = mongodb.get_collection("providers")
            provider = await providers_collection.find_one({"_id": obj_id})
            
            if provider:
                provider["_id"] = str(provider["_id"])
                provider.pop("password", None)
                return provider
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Errore ricerca utente per ID: {e}")
            return None
    
    @staticmethod
    async def update_user(user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Aggiorna i dati di un utente
        """
        try:
            obj_id = ObjectId(user_id)
            
            # Aggiungi timestamp aggiornamento
            updates["updated_at"] = datetime.utcnow()
            
            # Rimuovi campi che non possono essere aggiornati
            updates.pop("_id", None)
            updates.pop("email", None)
            updates.pop("password", None)
            updates.pop("created_at", None)
            
            # Prova in users
            users_collection = mongodb.get_collection("users")
            result = await users_collection.find_one_and_update(
                {"_id": obj_id},
                {"$set": updates},
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                result.pop("password", None)
                logger.info(f"✅ Utente aggiornato: {user_id}")
                return result
            
            # Prova in providers
            providers_collection = mongodb.get_collection("providers")
            result = await providers_collection.find_one_and_update(
                {"_id": obj_id},
                {"$set": updates},
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                result.pop("password", None)
                logger.info(f"✅ Provider aggiornato: {user_id}")
                return result
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Errore aggiornamento utente: {e}")
            return None
    
    @staticmethod
    async def change_password(user_id: str, old_password: str, new_password: str) -> bool:
        """
        Cambia la password di un utente
        """
        try:
            user = await AuthService.find_user_by_id(user_id)
            
            if not user:
                return False
            
            # Verifica vecchia password
            if not AuthService.verify_password(old_password, user.get("password", "")):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password attuale errata"
                )
            
            # Hash nuova password
            new_hashed = AuthService.hash_password(new_password)
            
            # Aggiorna in database
            obj_id = ObjectId(user_id)
            
            # Determina collezione
            collection_name = "providers" if user.get("business_name") else "users"
            collection = mongodb.get_collection(collection_name)
            
            await collection.update_one(
                {"_id": obj_id},
                {"$set": {
                    "password": new_hashed,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            logger.info(f"✅ Password cambiata per utente: {user_id}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Errore cambio password: {e}")
            return False
    
    @staticmethod
    def create_token_pair(user: Dict[str, Any]) -> Dict[str, str]:
        """
        Crea una coppia access + refresh token per un utente
        """
        token_data = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "user_type": user["user_type"]
        }
        
        access_token = AuthService.create_access_token(token_data)
        refresh_token = AuthService.create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
