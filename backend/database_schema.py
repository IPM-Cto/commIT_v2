"""
Database Schema per MongoDB - commIT
Definizione delle collezioni e dei modelli di dati (Pydantic v2)
"""

from typing import Optional, List, Dict, Any, Annotated
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from bson import ObjectId


class PyObjectId(ObjectId):
    """Classe per gestire ObjectId MongoDB con Pydantic v2"""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.with_info_before_validator_function(
            cls.validate,
            core_schema.str_schema(),
        )

    @classmethod
    def validate(cls, v, info=None):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    def __str__(self):
        return str(self)


class UserType(str, Enum):
    """Tipi di utente nel sistema"""
    CUSTOMER = "customer"  # Utente finale
    PROVIDER = "provider"  # Provider di servizi
    ADMIN = "admin"       # Amministratore sistema


class ServiceCategory(str, Enum):
    """Categorie di servizi disponibili"""
    RESTAURANT = "restaurant"
    SHOP = "shop"
    BEAUTY = "beauty"  # Parrucchiere, estetista
    HEALTH = "health"  # Medici, dentisti
    PROFESSIONAL = "professional"  # Avvocati, commercialisti
    HOME_SERVICES = "home_services"  # Idraulici, elettricisti
    OTHER = "other"


class BookingStatus(str, Enum):
    """Stati di una prenotazione"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


# ==================== MODELLI UTENTE ====================

class Address(BaseModel):
    """Modello per indirizzo"""
    street: str
    city: str
    postal_code: str
    province: Optional[str] = None
    country: str = "Italia"
    coordinates: Optional[Dict[str, float]] = None  # {"lat": 45.464, "lng": 9.188}


class UserBase(BaseModel):
    """Schema base per utenti"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "auth0_id": "auth0|123456",
                "user_type": "customer",
                "full_name": "Mario Rossi",
                "phone": "+393331234567"
            }
        }
    )

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    auth0_id: str  # ID fornito da Auth0
    user_type: UserType
    full_name: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    email_verified: bool = False
    phone_verified: bool = False
    language: str = "it"


class Customer(UserBase):
    """Schema per utenti finali (customers)"""
    user_type: UserType = UserType.CUSTOMER
    preferences: Dict[str, Any] = Field(default_factory=dict)
    favorite_providers: List[str] = Field(default_factory=list)
    address: Optional[Address] = None
    date_of_birth: Optional[datetime] = None

    # Statistiche
    total_bookings: int = 0
    completed_bookings: int = 0
    cancelled_bookings: int = 0


class BusinessHours(BaseModel):
    """Orari di apertura per giorno"""
    day: int  # 0=Lunedì, 6=Domenica
    open_time: str  # "09:00"
    close_time: str  # "18:00"
    is_closed: bool = False


class Provider(UserBase):
    """Schema per provider di servizi"""
    user_type: UserType = UserType.PROVIDER
    business_name: str
    service_category: ServiceCategory
    description: Optional[str] = None
    address: Address

    # Dettagli business
    vat_number: Optional[str] = None  # Partita IVA
    business_hours: List[BusinessHours] = Field(default_factory=list)
    services_offered: List[Dict[str, Any]] = Field(default_factory=list)

    # Media e documenti
    logo_url: Optional[str] = None
    cover_image: Optional[str] = None
    gallery: List[str] = Field(default_factory=list)
    documents: List[Dict[str, Any]] = Field(default_factory=list)

    # Configurazione
    accepts_online_bookings: bool = True
    instant_booking: bool = False  # Conferma automatica
    cancellation_policy: Optional[str] = None
    payment_methods: List[str] = Field(default_factory=lambda: ["cash", "card"])

    # Rating e recensioni
    rating: float = 0.0
    total_reviews: int = 0

    # Statistiche
    total_bookings: int = 0
    completed_bookings: int = 0
    response_time_minutes: Optional[int] = None

    # SEO e ricerca
    tags: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)

    # Subscription/Piano
    subscription_plan: str = "free"  # free, basic, premium
    subscription_expires: Optional[datetime] = None

    @field_validator('services_offered')
    @classmethod
    def validate_services(cls, v):
        """Valida struttura servizi offerti"""
        for service in v:
            if not all(k in service for k in ['name', 'price', 'duration']):
                raise ValueError("Service must have name, price, and duration")
        return v


# ==================== MODELLI BOOKING ====================

class Booking(BaseModel):
    """Schema per prenotazioni"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    customer_id: str
    provider_id: str

    # Dettagli servizio
    service_name: str
    service_price: float
    service_duration: int  # minuti

    # Tempistiche
    booking_date: datetime
    booking_time: str  # "14:30"
    end_time: str  # Calcolato

    # Status
    status: BookingStatus = BookingStatus.PENDING

    # Note e dettagli
    customer_note: Optional[str] = None
    provider_note: Optional[str] = None
    special_requests: Optional[str] = None

    # Tracking
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None
    completed_at: Optional[datetime] = None

    # Pagamento
    payment_method: str = "cash"
    payment_status: str = "pending"  # pending, paid, refunded
    paid_at: Optional[datetime] = None

    # Reminder
    reminder_sent: bool = False
    reminder_sent_at: Optional[datetime] = None


# ==================== MODELLI CHAT/AI ====================

class ChatSession(BaseModel):
    """Schema per sessioni chat con AI"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    user_type: UserType

    # Sessione
    session_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    is_active: bool = True

    # Contesto
    context: Dict[str, Any] = Field(default_factory=dict)
    intent: Optional[str] = None  # booking, info, support, etc.

    # Statistiche
    message_count: int = 0
    ai_suggestions: List[str] = Field(default_factory=list)


class ChatMessage(BaseModel):
    """Schema per messaggi chat"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    session_id: str
    user_id: str

    # Messaggio
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Metadata
    intent: Optional[str] = None
    entities: Dict[str, Any] = Field(default_factory=dict)
    confidence: Optional[float] = None

    # Azioni suggerite
    suggested_actions: List[Dict[str, Any]] = Field(default_factory=list)

    # Provider suggeriti (se applicabile)
    suggested_providers: List[str] = Field(default_factory=list)


# ==================== MODELLI RECENSIONI ====================

class Review(BaseModel):
    """Schema per recensioni"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    booking_id: str
    customer_id: str
    provider_id: str

    # Valutazione
    rating: int  # 1-5
    comment: Optional[str] = None

    # Dettagli valutazione
    service_rating: Optional[int] = None
    punctuality_rating: Optional[int] = None
    cleanliness_rating: Optional[int] = None
    value_rating: Optional[int] = None

    # Media
    photos: List[str] = Field(default_factory=list)

    # Risposta provider
    provider_response: Optional[str] = None
    provider_response_at: Optional[datetime] = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_verified: bool = True  # Prenotazione verificata
    is_visible: bool = True

    # Utilità recensione
    helpful_count: int = 0
    reported: bool = False
    reported_reason: Optional[str] = None


# ==================== MODELLI NOTIFICHE ====================

class Notification(BaseModel):
    """Schema per notifiche"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str

    # Contenuto
    title: str
    message: str
    type: str  # booking, reminder, promotion, system
    priority: str = "normal"  # low, normal, high, urgent

    # Azioni
    action_url: Optional[str] = None
    action_data: Dict[str, Any] = Field(default_factory=dict)

    # Status
    is_read: bool = False
    read_at: Optional[datetime] = None

    # Invio
    channels: List[str] = Field(default_factory=lambda: ["in_app"])  # in_app, email, sms, push
    sent_via: Dict[str, bool] = Field(default_factory=dict)

    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_for: Optional[datetime] = None
    expires_at: Optional[datetime] = None


# ==================== INDICI MONGODB ====================

MONGODB_INDEXES = {
    "users": [
        ("email", 1),  # Indice unique su email
        ("auth0_id", 1),  # Indice unique su auth0_id
        ("user_type", 1),
        ("created_at", -1),
        [("user_type", 1), ("is_active", 1)]
    ],
    "providers": [
        ("service_category", 1),
        ("rating", -1),
        ("address.city", 1),
        ("tags", 1),
        ("business_name", "text"),  # Text index per ricerca
        [("service_category", 1), ("rating", -1)],
        [("address.coordinates", "2dsphere")]  # Geo index
    ],
    "bookings": [
        ("customer_id", 1),
        ("provider_id", 1),
        ("status", 1),
        ("booking_date", 1),
        ("created_at", -1),
        [("customer_id", 1), ("status", 1)],
        [("provider_id", 1), ("status", 1), ("booking_date", 1)]
    ],
    "chat_sessions": [
        ("user_id", 1),
        ("session_id", 1),
        ("is_active", 1),
        ("started_at", -1)
    ],
    "chat_messages": [
        ("session_id", 1),
        ("timestamp", 1),
        [("session_id", 1), ("timestamp", 1)]
    ],
    "reviews": [
        ("provider_id", 1),
        ("customer_id", 1),
        ("booking_id", 1),
        ("rating", -1),
        ("created_at", -1),
        [("provider_id", 1), ("rating", -1)]
    ],
    "notifications": [
        ("user_id", 1),
        ("is_read", 1),
        ("created_at", -1),
        [("user_id", 1), ("is_read", 1)]
    ]
}