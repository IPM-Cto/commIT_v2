"""
Connessione e configurazione MongoDB per commIT
"""

import os
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, OperationFailure
from dotenv import load_dotenv
import logging
from datetime import datetime

from database_schema import (
    MONGODB_INDEXES,
    UserType,
    ServiceCategory,
    BookingStatus,
    Customer,
    Provider,
    Booking,
    ChatSession,
    ChatMessage,
    Review,
    Notification
)

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MongoDB:
    """
    Classe singleton per gestire la connessione MongoDB
    """
    _instance = None
    _client: Optional[AsyncIOMotorClient] = None
    _database: Optional[AsyncIOMotorDatabase] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDB, cls).__new__(cls)
        return cls._instance

    async def connect(self) -> AsyncIOMotorDatabase:
        """
        Connette al database MongoDB
        """
        if self._database is not None:
            return self._database

        try:
            # Configurazione connessione
            mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
            db_name = os.getenv("DB_NAME", "commit")

            # Opzioni di connessione
            client_options = {
                'serverSelectionTimeoutMS': 5000,
                'connectTimeoutMS': 10000,
                'socketTimeoutMS': 10000,
                'maxPoolSize': 50,
                'minPoolSize': 10
            }

            # Crea client
            self._client = AsyncIOMotorClient(mongo_url, **client_options)

            # Test connessione
            await self._client.server_info()
            logger.info(f"✅ Connesso a MongoDB: {mongo_url}")

            # Seleziona database
            self._database = self._client[db_name]

            # Inizializza collezioni e indici
            await self._initialize_collections()

            return self._database

        except ConnectionFailure as e:
            logger.error(f"❌ Errore connessione MongoDB: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Errore generico MongoDB: {e}")
            raise

    async def disconnect(self):
        """
        Chiude la connessione al database
        """
        if self._client is not None:
            self._client.close()
            self._client = None
            self._database = None
            logger.info("Disconnesso da MongoDB")

    async def _initialize_collections(self):
        """
        Inizializza le collezioni e crea gli indici necessari
        """
        if self._database is None:
            return

        try:
            # Lista delle collezioni necessarie
            required_collections = [
                'users',
                'providers',
                'bookings',
                'chat_sessions',
                'chat_messages',
                'reviews',
                'notifications'
            ]

            # Ottieni collezioni esistenti
            existing_collections = await self._database.list_collection_names()

            # Crea collezioni mancanti
            for collection_name in required_collections:
                if collection_name not in existing_collections:
                    await self._database.create_collection(collection_name)
                    logger.info(f"📁 Creata collezione: {collection_name}")

            # Crea indici
            await self._create_indexes()

            # Inserisci dati di esempio se database vuoto
            await self._seed_initial_data()

        except Exception as e:
            logger.error(f"❌ Errore inizializzazione collezioni: {e}")
            raise

    async def _create_indexes(self):
        """
        Crea gli indici per ottimizzare le query
        """
        for collection_name, indexes in MONGODB_INDEXES.items():
            collection = self._database[collection_name]

            for index in indexes:
                try:
                    if isinstance(index, list):
                        # Indice composto
                        await collection.create_index(index)
                    elif isinstance(index, tuple):
                        # Indice singolo
                        field, direction = index

                        # Gestisci indici speciali
                        if direction == "text":
                            await collection.create_index([(field, "text")])
                        elif direction == "2dsphere":
                            await collection.create_index([(field, "2dsphere")])
                        else:
                            # Indice normale
                            unique = field in ["email", "auth0_id"]
                            await collection.create_index(
                                [(field, direction)],
                                unique=unique
                            )

                    logger.info(f"📊 Indice creato per {collection_name}: {index}")

                except OperationFailure as e:
                    # Indice probabilmente già esiste
                    logger.debug(f"Indice già esistente: {e}")
                except Exception as e:
                    logger.error(f"❌ Errore creazione indice: {e}")

    async def _seed_initial_data(self):
        """
        Inserisce dati iniziali di esempio se il database è vuoto
        """
        try:
            # Controlla se ci sono già utenti
            users_count = await self._database.users.count_documents({})

            if users_count == 0:
                logger.info("🌱 Inserimento dati di esempio...")

                # Admin user
                admin_user = {
                    "email": "admin@commit.it",
                    "auth0_id": "auth0|admin123",
                    "user_type": UserType.ADMIN,
                    "full_name": "Admin CommIT",
                    "phone": "+393331234567",
                    "is_active": True,
                    "email_verified": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }

                await self._database.users.insert_one(admin_user)

                # Provider di esempio
                example_providers = [
                    {
                        "email": "pizzeria.napoli@example.com",
                        "auth0_id": "auth0|provider1",
                        "user_type": UserType.PROVIDER,
                        "full_name": "Mario Rossi",
                        "business_name": "Pizzeria Napoli",
                        "service_category": ServiceCategory.RESTAURANT,
                        "description": "Autentica pizza napoletana dal 1950",
                        "address": {
                            "street": "Via Roma 1",
                            "city": "Milano",
                            "postal_code": "20121",
                            "province": "MI",
                            "country": "Italia",
                            "coordinates": {"lat": 45.464, "lng": 9.188}
                        },
                        "phone": "+390212345678",
                        "rating": 4.5,
                        "total_reviews": 120,
                        "tags": ["pizza", "napoletana", "forno a legna"],
                        "is_active": True,
                        "email_verified": True,
                        "accepts_online_bookings": True,
                        "business_hours": [
                            {"day": i, "open_time": "11:00", "close_time": "23:00", "is_closed": False}
                            for i in range(7)
                        ],
                        "services_offered": [
                            {"name": "Tavolo per 2", "price": 0, "duration": 120},
                            {"name": "Tavolo per 4", "price": 0, "duration": 120}
                        ],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    },
                    {
                        "email": "barber.style@example.com",
                        "auth0_id": "auth0|provider2",
                        "user_type": UserType.PROVIDER,
                        "full_name": "Giuseppe Verdi",
                        "business_name": "Barber Style",
                        "service_category": ServiceCategory.BEAUTY,
                        "description": "Barbiere professionale per uomo",
                        "address": {
                            "street": "Corso Buenos Aires 25",
                            "city": "Milano",
                            "postal_code": "20124",
                            "province": "MI",
                            "country": "Italia",
                            "coordinates": {"lat": 45.478, "lng": 9.205}
                        },
                        "phone": "+390298765432",
                        "rating": 4.8,
                        "total_reviews": 85,
                        "tags": ["barbiere", "uomo", "barba", "capelli"],
                        "is_active": True,
                        "email_verified": True,
                        "accepts_online_bookings": True,
                        "business_hours": [
                            {"day": 0, "open_time": "09:00", "close_time": "19:00", "is_closed": False},
                            {"day": 1, "open_time": "09:00", "close_time": "19:00", "is_closed": False},
                            {"day": 2, "open_time": "09:00", "close_time": "19:00", "is_closed": False},
                            {"day": 3, "open_time": "09:00", "close_time": "19:00", "is_closed": False},
                            {"day": 4, "open_time": "09:00", "close_time": "19:00", "is_closed": False},
                            {"day": 5, "open_time": "09:00", "close_time": "13:00", "is_closed": False},
                            {"day": 6, "open_time": "09:00", "close_time": "13:00", "is_closed": True}
                        ],
                        "services_offered": [
                            {"name": "Taglio uomo", "price": 25, "duration": 30},
                            {"name": "Barba", "price": 15, "duration": 20},
                            {"name": "Taglio + Barba", "price": 35, "duration": 45}
                        ],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                ]

                for provider in example_providers:
                    await self._database.providers.insert_one(provider)

                logger.info("✅ Dati di esempio inseriti con successo")

        except Exception as e:
            logger.error(f"❌ Errore seed data: {e}")

    def get_collection(self, name: str):
        """
        Ottiene una collezione specifica
        """
        if self._database is None:
            raise RuntimeError("Database non connesso")
        return self._database[name]

    @property
    def database(self) -> AsyncIOMotorDatabase:
        """
        Ritorna l'istanza del database
        """
        if self._database is None:
            raise RuntimeError("Database non connesso")
        return self._database

    @property
    def client(self) -> AsyncIOMotorClient:
        """
        Ritorna il client MongoDB
        """
        if self._client is None:
            raise RuntimeError("Client non connesso")
        return self._client


# Istanza singleton
mongodb = MongoDB()


# Helper functions per operazioni comuni
class DatabaseHelper:
    """
    Classe helper per operazioni comuni sul database
    """

    @staticmethod
    async def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Trova utente per email"""
        collection = mongodb.get_collection("users")
        return await collection.find_one({"email": email})

    @staticmethod
    async def find_user_by_auth0_id(auth0_id: str) -> Optional[Dict[str, Any]]:
        """Trova utente per Auth0 ID"""
        collection = mongodb.get_collection("users")
        return await collection.find_one({"auth0_id": auth0_id})

    @staticmethod
    async def find_provider_by_id(provider_id: str) -> Optional[Dict[str, Any]]:
        """Trova provider per ID"""
        collection = mongodb.get_collection("providers")
        from bson import ObjectId
        return await collection.find_one({"_id": ObjectId(provider_id)})

    @staticmethod
    async def search_providers(
            category: Optional[ServiceCategory] = None,
            city: Optional[str] = None,
            tags: Optional[List[str]] = None,
            min_rating: float = 0.0,
            limit: int = 20,
            skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Ricerca avanzata provider
        """
        collection = mongodb.get_collection("providers")

        # Costruisci query
        query = {"is_active": True}

        if category:
            query["service_category"] = category

        if city:
            query["address.city"] = {"$regex": city, "$options": "i"}

        if tags:
            query["tags"] = {"$in": tags}

        if min_rating > 0:
            query["rating"] = {"$gte": min_rating}

        # Esegui query con ordinamento
        cursor = collection.find(query).sort("rating", -1).skip(skip).limit(limit)

        return await cursor.to_list(length=limit)

    @staticmethod
    async def get_user_bookings(
            user_id: str,
            user_type: UserType,
            status: Optional[BookingStatus] = None,
            limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Ottiene prenotazioni di un utente
        """
        collection = mongodb.get_collection("bookings")

        # Query base
        if user_type == UserType.CUSTOMER:
            query = {"customer_id": user_id}
        elif user_type == UserType.PROVIDER:
            query = {"provider_id": user_id}
        else:
            return []

        if status:
            query["status"] = status

        # Esegui query
        cursor = collection.find(query).sort("booking_date", -1).limit(limit)

        return await cursor.to_list(length=limit)

    @staticmethod
    async def create_chat_session(user_id: str, user_type: UserType) -> str:
        """
        Crea una nuova sessione chat
        """
        import uuid

        collection = mongodb.get_collection("chat_sessions")

        session = {
            "user_id": user_id,
            "user_type": user_type,
            "session_id": str(uuid.uuid4()),
            "started_at": datetime.utcnow(),
            "is_active": True,
            "message_count": 0,
            "context": {},
            "ai_suggestions": []
        }

        result = await collection.insert_one(session)
        return session["session_id"]

    @staticmethod
    async def save_chat_message(
            session_id: str,
            user_id: str,
            role: str,
            content: str,
            **kwargs
    ) -> str:
        """
        Salva un messaggio chat
        """
        collection = mongodb.get_collection("chat_messages")

        message = {
            "session_id": session_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow(),
            **kwargs
        }

        result = await collection.insert_one(message)

        # Aggiorna contatore messaggi nella sessione
        sessions_collection = mongodb.get_collection("chat_sessions")
        await sessions_collection.update_one(
            {"session_id": session_id},
            {"$inc": {"message_count": 1}}
        )

        return str(result.inserted_id)


# Test connessione
async def test_connection():
    """
    Funzione per testare la connessione al database
    """
    try:
        db = await mongodb.connect()
        logger.info("✅ Test connessione riuscito")

        # Test query
        users_count = await db.users.count_documents({})
        providers_count = await db.providers.count_documents({})

        logger.info(f"📊 Statistiche database:")
        logger.info(f"   - Utenti: {users_count}")
        logger.info(f"   - Provider: {providers_count}")

        return True

    except Exception as e:
        logger.error(f"❌ Test connessione fallito: {e}")
        return False
    finally:
        await mongodb.disconnect()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_connection())