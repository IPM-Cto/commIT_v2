"""
📝 Auth Models - Modelli Pydantic per Autenticazione
Validazione input/output per tutte le operazioni auth
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from database_schema import UserType, ServiceCategory


# ==================== REQUEST MODELS ====================

class RegisterRequest(BaseModel):
    """Richiesta registrazione utente"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    user_type: UserType
    phone: Optional[str] = None
    
    # Campi specifici per Customer
    preferences: Optional[Dict[str, Any]] = {}
    
    # Campi specifici per Provider
    business_name: Optional[str] = None
    service_category: Optional[ServiceCategory] = None
    description: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    vat_number: Optional[str] = None
    business_hours: Optional[List[Dict[str, Any]]] = []
    services_offered: Optional[List[Dict[str, Any]]] = []
    tags: Optional[List[str]] = []
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Valida forza password"""
        if len(v) < 8:
            raise ValueError('Password deve essere almeno 8 caratteri')
        if not any(c.isupper() for c in v):
            raise ValueError('Password deve contenere almeno una maiuscola')
        if not any(c.islower() for c in v):
            raise ValueError('Password deve contenere almeno una minuscola')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password deve contenere almeno un numero')
        return v
    
    @field_validator('business_name')
    @classmethod
    def validate_provider_fields(cls, v, info):
        """Valida campi obbligatori per provider"""
        if info.data.get('user_type') == UserType.PROVIDER:
            if not v:
                raise ValueError('Business name obbligatorio per provider')
        return v
    
    class ConfigDict:
        json_schema_extra = {
            "example": {
                "email": "mario.rossi@example.com",
                "password": "SecurePass123!",
                "full_name": "Mario Rossi",
                "user_type": "customer",
                "phone": "+393331234567",
                "preferences": {}
            }
        }


class LoginRequest(BaseModel):
    """Richiesta login"""
    email: EmailStr
    password: str
    
    class ConfigDict:
        json_schema_extra = {
            "example": {
                "email": "mario.rossi@example.com",
                "password": "SecurePass123!"
            }
        }


class RefreshTokenRequest(BaseModel):
    """Richiesta refresh token"""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Richiesta cambio password"""
    old_password: str
    new_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v, info):
        """Valida nuova password"""
        if v == info.data.get('old_password'):
            raise ValueError('Nuova password deve essere diversa dalla vecchia')
        if len(v) < 8:
            raise ValueError('Password deve essere almeno 8 caratteri')
        return v


class UpdateProfileRequest(BaseModel):
    """Richiesta aggiornamento profilo"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    
    # Customer fields
    preferences: Optional[Dict[str, Any]] = None
    
    # Provider fields
    business_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    business_hours: Optional[List[Dict[str, Any]]] = None
    services_offered: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None


# ==================== RESPONSE MODELS ====================

class UserResponse(BaseModel):
    """Risposta con dati utente (base)"""
    id: str
    email: EmailStr
    full_name: str
    user_type: UserType
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class ConfigDict:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "mario.rossi@example.com",
                "full_name": "Mario Rossi",
                "user_type": "customer",
                "is_active": True,
                "email_verified": False,
                "created_at": "2025-01-01T10:00:00",
                "updated_at": "2025-01-01T10:00:00"
            }
        }


class CustomerResponse(UserResponse):
    """Risposta con dati customer"""
    phone: Optional[str]
    preferences: Dict[str, Any]
    favorite_providers: List[str]
    total_bookings: int


class ProviderResponse(UserResponse):
    """Risposta con dati provider"""
    business_name: str
    phone: Optional[str]
    service_category: ServiceCategory
    description: str
    address: Dict[str, Any]
    vat_number: Optional[str]
    business_hours: List[Dict[str, Any]]
    services_offered: List[Dict[str, Any]]
    accepts_online_bookings: bool
    rating: float
    total_reviews: int
    tags: List[str]


class TokenResponse(BaseModel):
    """Risposta con tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minuti in secondi


class LoginResponse(BaseModel):
    """Risposta completa login"""
    success: bool = True
    message: str
    user: Dict[str, Any]
    tokens: TokenResponse


class RegisterResponse(BaseModel):
    """Risposta completa registrazione"""
    success: bool = True
    message: str
    user: Dict[str, Any]
    tokens: TokenResponse


class StandardResponse(BaseModel):
    """Risposta standard per operazioni generiche"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Risposta errore"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
