"""
🚀 CommIT Server v2.0 - Versione Ristrutturata Completa
Sistema di autenticazione moderno, robusto e scalabile
"""

from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from dotenv import load_dotenv
import uvicorn

# Import moduli locali
from database import mongodb, DatabaseHelper
from database_schema import UserType, ServiceCategory, BookingStatus
from auth_service import AuthService
from auth_models import (
    RegisterRequest, LoginRequest, RefreshTokenRequest,
    ChangePasswordRequest, UpdateProfileRequest,
    LoginResponse, RegisterResponse, StandardResponse, ErrorResponse
)

# Load environment
load_dotenv()

# Setup logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer(auto_error=False)

# ==================== LIFECYCLE ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestisce il ciclo di vita dell'applicazione"""
    # Startup
    logger.info("🚀 Avvio CommIT Server v2.0...")
    
    try:
        await mongodb.connect()
        logger.info("✅ Database connesso")
    except Exception as e:
        logger.error(f"❌ Errore connessione database: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Arresto server...")
    try:
        await mongodb.disconnect()
        logger.info("✅ Database disconnesso")
    except:
        pass

# ==================== APP SETUP ====================

app = FastAPI(
    title="CommIT API v2.0",
    description="API Ristrutturata per gestione prenotazioni e servizi",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MIDDLEWARE ====================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log tutte le richieste"""
    start_time = datetime.utcnow()
    
    # Log richiesta
    logger.info(f"📥 {request.method} {request.url.path}")
    
    # Processa richiesta
    response = await call_next(request)
    
    # Log risposta
    process_time = (datetime.utcnow() - start_time).total_seconds()
    logger.info(
        f"📤 {request.method} {request.url.path} "
        f"- Status: {response.status_code} "
        f"- Time: {process_time:.3f}s"
    )
    
    return response

# ==================== DEPENDENCIES ====================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Dependency per ottenere l'utente corrente dal token JWT
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di autenticazione richiesto",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Decodifica token
        payload = AuthService.decode_token(credentials.credentials)
        
        # Verifica tipo token
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # Ottieni user_id
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Trova utente nel database
        user = await AuthService.find_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account disattivato"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Errore get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Dependency opzionale per ottenere utente se autenticato"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except:
        return None


# ==================== AUTH ROUTES ====================

@app.post(
    "/api/v2/auth/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"]
)
async def register(request: RegisterRequest):
    """
    🆕 Registrazione nuovo utente
    
    - **email**: Email univoca dell'utente
    - **password**: Password (min 8 caratteri, con maiuscola, minuscola e numero)
    - **full_name**: Nome completo
    - **user_type**: Tipo utente (customer o provider)
    - **Altri campi**: Basati sul tipo utente
    """
    try:
        logger.info(f"📝 Nuova registrazione: {request.email} ({request.user_type})")
        
        # Crea utente
        user = await AuthService.register_user(
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            user_type=request.user_type,
            phone=request.phone,
            preferences=request.preferences if request.user_type == UserType.CUSTOMER else None,
            business_name=request.business_name,
            service_category=request.service_category,
            description=request.description,
            address=request.address,
            vat_number=request.vat_number,
            business_hours=request.business_hours,
            services_offered=request.services_offered,
            tags=request.tags
        )
        
        # Crea tokens
        tokens = AuthService.create_token_pair(user)
        
        logger.info(f"✅ Utente registrato: {request.email}")
        
        return {
            "success": True,
            "message": "Registrazione completata con successo",
            "user": user,
            "tokens": tokens
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Errore registrazione: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante la registrazione"
        )


@app.post(
    "/api/v2/auth/login",
    response_model=LoginResponse,
    tags=["Authentication"]
)
async def login(request: LoginRequest):
    """
    🔐 Login utente
    
    - **email**: Email dell'utente
    - **password**: Password dell'utente
    """
    try:
        logger.info(f"🔑 Tentativo login: {request.email}")
        
        # Autentica utente
        user = await AuthService.authenticate_user(request.email, request.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o password errati"
            )
        
        # Crea tokens
        tokens = AuthService.create_token_pair(user)
        
        logger.info(f"✅ Login successful: {request.email}")
        
        return {
            "success": True,
            "message": "Login effettuato con successo",
            "user": user,
            "tokens": tokens
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Errore login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante il login"
        )


@app.post(
    "/api/v2/auth/refresh",
    tags=["Authentication"]
)
async def refresh_token(request: RefreshTokenRequest):
    """
    🔄 Refresh access token usando refresh token
    
    - **refresh_token**: Refresh token valido
    """
    try:
        # Decodifica refresh token
        payload = AuthService.decode_token(request.refresh_token)
        
        # Verifica tipo token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # Trova utente
        user_id = payload.get("sub")
        user = await AuthService.find_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Crea nuovo access token
        token_data = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "user_type": user["user_type"]
        }
        
        new_access_token = AuthService.create_access_token(token_data)
        
        return {
            "success": True,
            "access_token": new_access_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Errore refresh token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@app.get(
    "/api/v2/auth/me",
    tags=["Authentication"]
)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    👤 Ottieni informazioni utente corrente
    
    Richiede autenticazione con Bearer token
    """
    return {
        "success": True,
        "user": current_user
    }


@app.put(
    "/api/v2/auth/profile",
    tags=["Authentication"]
)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    ✏️ Aggiorna profilo utente
    
    - Aggiorna solo i campi forniti
    - Richiede autenticazione
    """
    try:
        # Prepara updates (rimuovi None)
        updates = {k: v for k, v in request.dict().items() if v is not None}
        
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nessun campo da aggiornare"
            )
        
        # Aggiorna utente
        updated_user = await AuthService.update_user(
            current_user["_id"],
            updates
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utente non trovato"
            )
        
        return {
            "success": True,
            "message": "Profilo aggiornato con successo",
            "user": updated_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Errore aggiornamento profilo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante l'aggiornamento"
        )


@app.post(
    "/api/v2/auth/change-password",
    tags=["Authentication"]
)
async def change_password(
    request: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    🔒 Cambia password utente
    
    - **old_password**: Password attuale
    - **new_password**: Nuova password
    """
    try:
        success = await AuthService.change_password(
            current_user["_id"],
            request.old_password,
            request.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossibile cambiare password"
            )
        
        return {
            "success": True,
            "message": "Password cambiata con successo"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Errore cambio password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante il cambio password"
        )


@app.post(
    "/api/v2/auth/logout",
    tags=["Authentication"]
)
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    🚪 Logout utente
    
    Nota: Con JWT stateless, il logout è gestito lato client
    eliminando i tokens. Questo endpoint è per compatibilità.
    """
    return {
        "success": True,
        "message": "Logout effettuato con successo"
    }


# ==================== PROVIDER ROUTES ====================

@app.get(
    "/api/v2/providers",
    tags=["Providers"]
)
async def get_providers(
    category: Optional[str] = None,
    city: Optional[str] = None,
    tags: Optional[str] = None,
    min_rating: float = 0.0,
    limit: int = 20,
    skip: int = 0,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    📋 Lista provider con filtri opzionali
    
    - **category**: Filtra per categoria servizio
    - **city**: Filtra per città
    - **tags**: Filtra per tags (separati da virgola)
    - **min_rating**: Rating minimo
    - **limit**: Numero risultati (max 100)
    - **skip**: Paginazione offset
    """
    try:
        # Validazione
        if limit > 100:
            limit = 100
        
        # Parse parametri
        tags_list = tags.split(",") if tags else None
        category_enum = ServiceCategory(category) if category else None
        
        # Cerca provider
        providers = await DatabaseHelper.search_providers(
            category=category_enum,
            city=city,
            tags=tags_list,
            min_rating=min_rating,
            limit=limit,
            skip=skip
        )
        
        # Converti ObjectId
        for provider in providers:
            if "_id" in provider and hasattr(provider["_id"], "__str__"):
                provider["_id"] = str(provider["_id"])
            # Rimuovi password se presente
            provider.pop("password", None)
        
        return {
            "success": True,
            "count": len(providers),
            "providers": providers
        }
        
    except Exception as e:
        logger.error(f"❌ Errore ricerca provider: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante la ricerca"
        )


@app.get(
    "/api/v2/providers/{provider_id}",
    tags=["Providers"]
)
async def get_provider_details(
    provider_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    🏪 Dettagli provider specifico
    
    - **provider_id**: ID del provider
    """
    try:
        provider = await DatabaseHelper.find_provider_by_id(provider_id)
        
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider non trovato"
            )
        
        # Converti ObjectId e rimuovi password
        provider["_id"] = str(provider["_id"])
        provider.pop("password", None)
        
        return {
            "success": True,
            "provider": provider
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Errore get provider: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante il recupero dei dati"
        )


# ==================== BOOKINGS ROUTES ====================

@app.get(
    "/api/v2/bookings",
    tags=["Bookings"]
)
async def get_bookings(
    status_filter: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    📅 Lista prenotazioni utente
    
    - **status_filter**: Filtra per status (pending, confirmed, etc.)
    - **limit**: Numero risultati
    - **skip**: Paginazione offset
    """
    try:
        # Parse status
        booking_status = BookingStatus(status_filter) if status_filter else None
        
        # Ottieni prenotazioni
        bookings = await DatabaseHelper.get_user_bookings(
            user_id=current_user["_id"],
            user_type=UserType(current_user["user_type"]),
            status=booking_status,
            limit=limit
        )
        
        # Converti ObjectId
        for booking in bookings:
            if "_id" in booking:
                booking["_id"] = str(booking["_id"])
        
        return {
            "success": True,
            "count": len(bookings),
            "bookings": bookings
        }
        
    except Exception as e:
        logger.error(f"❌ Errore get bookings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante il recupero delle prenotazioni"
        )


# ==================== HEALTH & STATUS ====================

@app.get("/", tags=["Status"])
async def root():
    """🏠 Root endpoint - Status API"""
    return {
        "name": "CommIT API",
        "version": "2.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "database_connected": mongodb._database is not None,
        "docs": "/docs"
    }


@app.get("/health", tags=["Status"])
async def health_check():
    """❤️ Health check endpoint"""
    try:
        # Check database
        if mongodb._database is not None:
            await mongodb.database.command("ping")
            db_status = "healthy"
        else:
            db_status = "not_connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    is_healthy = db_status == "healthy"
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if is_healthy else "unhealthy",
            "database": db_status,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler per HTTPException"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler per eccezioni generiche"""
    logger.error(f"❌ Unhandled exception: {exc}")
    logger.exception("Stack trace:")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG") == "True" else None
        }
    )


# ==================== MAIN ====================

if __name__ == "__main__":
    uvicorn.run(
        "server_v2:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8001)),
        reload=os.getenv("RELOAD", "True") == "True",
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
