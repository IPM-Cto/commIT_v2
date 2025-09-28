"""
AI Agent per commIT
Gestisce l'intelligenza artificiale per chat e raccomandazioni
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import re
from openai import AsyncOpenAI
from dotenv import load_dotenv

from database import mongodb, DatabaseHelper
from database_schema import ServiceCategory, UserType

# Load environment
load_dotenv()

# Setup logging
logger = logging.getLogger(__name__)

# OpenAI client
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class AIAgent:
    """
    Classe principale per l'AI Agent di commIT
    """
    
    def __init__(self):
        self.model = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        """
        Costruisce il prompt di sistema per l'AI
        """
        return """Sei l'assistente AI di commIT, una piattaforma per prenotazioni e servizi locali.

Il tuo compito è:
1. Aiutare gli utenti a trovare e prenotare servizi (ristoranti, negozi, parrucchieri, ecc.)
2. Rispondere alle domande sui provider disponibili
3. Assistere nella gestione delle prenotazioni
4. Fornire raccomandazioni personalizzate

Linee guida:
- Sii cordiale, professionale e utile
- Rispondi in italiano
- Quando suggerisci provider, basati sui dati reali del database
- Per prenotazioni, raccogli tutte le informazioni necessarie
- Se non sei sicuro, chiedi chiarimenti
- Mantieni le risposte concise ma complete

Informazioni che devi raccogliere per una prenotazione:
- Tipo di servizio richiesto
- Data e ora preferita
- Numero di persone (se applicabile)
- Richieste speciali
- Zona/città preferita

Ricorda: Non puoi confermare direttamente le prenotazioni, ma puoi guidare l'utente nel processo."""
    
    async def process_message(
        self,
        session_id: str,
        user_message: str,
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Processa un messaggio dell'utente e genera una risposta
        """
        try:
            # Analizza intent
            intent = await self._analyze_intent(user_message)
            
            # Estrai entità
            entities = await self._extract_entities(user_message)
            
            # Ottieni contesto sessione
            context = await self._get_session_context(session_id)
            
            # Genera risposta basata su intent
            response = await self._generate_response(
                user_message=user_message,
                intent=intent,
                entities=entities,
                context=context,
                user_data=user_data
            )
            
            # Aggiorna contesto sessione
            await self._update_session_context(
                session_id=session_id,
                intent=intent,
                entities=entities
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Errore processing message: {e}")
            return {
                "content": "Mi dispiace, si è verificato un errore. Riprova tra poco.",
                "intent": "error",
                "entities": {},
                "suggested_actions": [],
                "suggested_providers": []
            }
    
    async def _analyze_intent(self, message: str) -> str:
        """
        Analizza l'intent del messaggio
        """
        try:
            prompt = f"""Analizza l'intent di questo messaggio e rispondi SOLO con una di queste categorie:
            - booking: l'utente vuole prenotare un servizio
            - search: l'utente cerca informazioni su servizi/provider
            - manage_booking: l'utente vuole gestire una prenotazione esistente
            - recommendation: l'utente chiede consigli
            - support: l'utente ha bisogno di assistenza tecnica
            - greeting: saluto o conversazione generica
            - other: altro
            
            Messaggio: {message}
            
            Intent:"""
            
            response = await openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Sei un classificatore di intent."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0,
                max_tokens=10
            )
            
            intent = response.choices[0].message.content.strip().lower()
            
            # Valida intent
            valid_intents = ["booking", "search", "manage_booking", "recommendation", "support", "greeting", "other"]
            if intent not in valid_intents:
                intent = "other"
            
            return intent
            
        except Exception as e:
            logger.error(f"Errore analisi intent: {e}")
            return "other"
    
    async def _extract_entities(self, message: str) -> Dict[str, Any]:
        """
        Estrae entità dal messaggio
        """
        try:
            prompt = f"""Estrai le seguenti entità dal messaggio (rispondi in JSON):
            - service_type: tipo di servizio (ristorante, parrucchiere, negozio, etc.)
            - location: città o zona
            - date: data richiesta (formato YYYY-MM-DD)
            - time: ora richiesta (formato HH:MM)
            - people_count: numero di persone
            - price_range: fascia di prezzo (economico, medio, alto)
            - special_requests: richieste speciali
            
            Se un'entità non è presente, usa null.
            
            Messaggio: {message}
            
            JSON:"""
            
            response = await openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Sei un estrattore di entità NLP. Rispondi solo in JSON valido."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0,
                max_tokens=200
            )
            
            # Parse JSON response
            entities_text = response.choices[0].message.content.strip()
            entities = json.loads(entities_text)
            
            return entities
            
        except Exception as e:
            logger.error(f"Errore estrazione entità: {e}")
            return {}
    
    async def _get_session_context(self, session_id: str) -> Dict[str, Any]:
        """
        Ottiene il contesto della sessione
        """
        try:
            collection = mongodb.get_collection("chat_sessions")
            session = await collection.find_one({"session_id": session_id})
            
            if session:
                return session.get("context", {})
            
            return {}
            
        except Exception as e:
            logger.error(f"Errore get context: {e}")
            return {}
    
    async def _update_session_context(
        self,
        session_id: str,
        intent: str,
        entities: Dict[str, Any]
    ):
        """
        Aggiorna il contesto della sessione
        """
        try:
            collection = mongodb.get_collection("chat_sessions")
            
            # Merge entities con contesto esistente
            context_update = {
                "last_intent": intent,
                "last_update": datetime.utcnow().isoformat()
            }
            
            # Aggiungi entità non nulle
            for key, value in entities.items():
                if value is not None:
                    context_update[f"entity_{key}"] = value
            
            # Aggiorna database
            await collection.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        f"context.{k}": v 
                        for k, v in context_update.items()
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"Errore update context: {e}")
    
    async def _generate_response(
        self,
        user_message: str,
        intent: str,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Genera la risposta basata su intent e contesto
        """
        # Prepara risposta base
        response = {
            "content": "",
            "intent": intent,
            "entities": entities,
            "suggested_actions": [],
            "suggested_providers": []
        }
        
        try:
            # Gestisci diversi intent
            if intent == "booking":
                response = await self._handle_booking_intent(
                    user_message, entities, context, user_data
                )
            
            elif intent == "search":
                response = await self._handle_search_intent(
                    user_message, entities, context, user_data
                )
            
            elif intent == "recommendation":
                response = await self._handle_recommendation_intent(
                    user_message, entities, context, user_data
                )
            
            elif intent == "manage_booking":
                response = await self._handle_manage_booking_intent(
                    user_message, entities, context, user_data
                )
            
            elif intent == "greeting":
                response["content"] = await self._generate_greeting_response(user_data)
            
            else:
                # Risposta generica con AI
                response["content"] = await self._generate_generic_response(
                    user_message, context
                )
            
            return response
            
        except Exception as e:
            logger.error(f"Errore generate response: {e}")
            response["content"] = "Mi dispiace, non sono riuscito a elaborare la tua richiesta. Puoi riformularla?"
            return response
    
    async def _handle_booking_intent(
        self,
        message: str,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gestisce intent di prenotazione
        """
        response = {
            "content": "",
            "intent": "booking",
            "entities": entities,
            "suggested_actions": [],
            "suggested_providers": []
        }
        
        # Verifica quali informazioni mancano
        missing_info = []
        
        if not entities.get("service_type") and not context.get("entity_service_type"):
            missing_info.append("tipo di servizio")
        
        if not entities.get("date") and not context.get("entity_date"):
            missing_info.append("data")
        
        if not entities.get("time") and not context.get("entity_time"):
            missing_info.append("ora")
        
        if not entities.get("location") and not context.get("entity_location"):
            missing_info.append("zona/città")
        
        # Se mancano informazioni, chiedile
        if missing_info:
            response["content"] = f"Per aiutarti con la prenotazione, mi servono ancora: {', '.join(missing_info)}."
            response["suggested_actions"] = [
                {"type": "provide_info", "label": "Fornisci informazioni"}
            ]
        else:
            # Tutte le info disponibili, cerca provider
            service_type = entities.get("service_type") or context.get("entity_service_type")
            location = entities.get("location") or context.get("entity_location")
            
            # Mappa service_type a categoria
            category_map = {
                "ristorante": ServiceCategory.RESTAURANT,
                "pizzeria": ServiceCategory.RESTAURANT,
                "parrucchiere": ServiceCategory.BEAUTY,
                "barbiere": ServiceCategory.BEAUTY,
                "negozio": ServiceCategory.SHOP,
                "medico": ServiceCategory.HEALTH,
                "dentista": ServiceCategory.HEALTH
            }
            
            category = category_map.get(service_type.lower(), ServiceCategory.OTHER)
            
            # Cerca provider
            providers = await DatabaseHelper.search_providers(
                category=category,
                city=location,
                limit=5
            )
            
            if providers:
                provider_names = [p["business_name"] for p in providers]
                provider_ids = [str(p["_id"]) for p in providers]
                
                response["content"] = f"Ho trovato questi {service_type} nella zona di {location}:\n"
                for i, provider in enumerate(providers, 1):
                    rating_stars = "⭐" * int(provider.get("rating", 0))
                    response["content"] += f"\n{i}. **{provider['business_name']}** {rating_stars}"
                    if provider.get("description"):
                        response["content"] += f"\n   {provider['description']}"
                
                response["content"] += "\n\nQuale preferisci per la tua prenotazione?"
                
                response["suggested_providers"] = provider_ids
                response["suggested_actions"] = [
                    {"type": "select_provider", "label": "Seleziona provider"},
                    {"type": "search_again", "label": "Cerca altro"}
                ]
            else:
                response["content"] = f"Mi dispiace, non ho trovato {service_type} disponibili a {location}. Vuoi provare in un'altra zona?"
                response["suggested_actions"] = [
                    {"type": "change_location", "label": "Cambia zona"},
                    {"type": "change_service", "label": "Cambia servizio"}
                ]
        
        return response
    
    async def _handle_search_intent(
        self,
        message: str,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gestisce intent di ricerca
        """
        response = {
            "content": "",
            "intent": "search",
            "entities": entities,
            "suggested_actions": [],
            "suggested_providers": []
        }
        
        # Estrai parametri di ricerca
        service_type = entities.get("service_type")
        location = entities.get("location", "Milano")  # Default Milano
        
        if not service_type:
            response["content"] = "Che tipo di servizio stai cercando? Posso aiutarti a trovare ristoranti, parrucchieri, negozi e molto altro!"
            response["suggested_actions"] = [
                {"type": "category", "label": "Ristoranti"},
                {"type": "category", "label": "Parrucchieri"},
                {"type": "category", "label": "Negozi"},
                {"type": "category", "label": "Servizi medici"}
            ]
            return response
        
        # Mappa a categoria
        category_map = {
            "ristorante": ServiceCategory.RESTAURANT,
            "pizzeria": ServiceCategory.RESTAURANT, 
            "parrucchiere": ServiceCategory.BEAUTY,
            "barbiere": ServiceCategory.BEAUTY,
            "negozio": ServiceCategory.SHOP
        }
        
        category = category_map.get(service_type.lower())
        
        # Cerca provider
        providers = await DatabaseHelper.search_providers(
            category=category,
            city=location,
            limit=10
        )
        
        if providers:
            response["content"] = f"Ecco i migliori {service_type} a {location}:\n"
            
            for provider in providers[:5]:
                response["content"] += f"\n**{provider['business_name']}**"
                if provider.get("rating"):
                    response["content"] += f" - Valutazione: {provider['rating']}/5 ⭐"
                if provider.get("address"):
                    response["content"] += f"\n📍 {provider['address'].get('street', '')}, {provider['address'].get('city', '')}"
                if provider.get("description"):
                    response["content"] += f"\n{provider['description'][:100]}..."
                response["content"] += "\n"
            
            response["suggested_providers"] = [str(p["_id"]) for p in providers[:5]]
            response["suggested_actions"] = [
                {"type": "view_details", "label": "Vedi dettagli"},
                {"type": "book_now", "label": "Prenota ora"}
            ]
        else:
            response["content"] = f"Non ho trovato {service_type} a {location}. Vuoi cercare in un'altra zona?"
            response["suggested_actions"] = [
                {"type": "change_location", "label": "Cambia zona"},
                {"type": "change_service", "label": "Cambia servizio"}
            ]
        
        return response
    
    async def _handle_recommendation_intent(
        self,
        message: str,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gestisce richieste di raccomandazioni
        """
        response = {
            "content": "",
            "intent": "recommendation",
            "entities": entities,
            "suggested_actions": [],
            "suggested_providers": []
        }
        
        # Genera raccomandazioni personalizzate
        # In produzione, useremmo un sistema di raccomandazione ML
        
        # Per ora, suggerisci i top rated
        top_providers = await DatabaseHelper.search_providers(
            min_rating=4.5,
            limit=3
        )
        
        if top_providers:
            response["content"] = "Ecco i servizi più apprezzati dai nostri utenti:\n"
            
            for provider in top_providers:
                response["content"] += f"\n🏆 **{provider['business_name']}**"
                response["content"] += f" ({provider['service_category']})"
                response["content"] += f"\n   Valutazione: {provider['rating']}/5 ⭐"
                if provider.get("total_reviews"):
                    response["content"] += f" ({provider['total_reviews']} recensioni)"
                response["content"] += "\n"
            
            response["suggested_providers"] = [str(p["_id"]) for p in top_providers]
            response["suggested_actions"] = [
                {"type": "view_details", "label": "Scopri di più"},
                {"type": "book_now", "label": "Prenota"}
            ]
        else:
            response["content"] = "Sto ancora costruendo il database delle raccomandazioni. Cosa ti piacerebbe trovare?"
        
        return response
    
    async def _handle_manage_booking_intent(
        self,
        message: str,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gestisce richieste relative a prenotazioni esistenti
        """
        response = {
            "content": "",
            "intent": "manage_booking",
            "entities": entities,
            "suggested_actions": [],
            "suggested_providers": []
        }
        
        # Ottieni prenotazioni utente
        bookings = await DatabaseHelper.get_user_bookings(
            user_id=str(user_data["_id"]),
            user_type=user_data["user_type"],
            limit=5
        )
        
        if bookings:
            response["content"] = "Ecco le tue prossime prenotazioni:\n"
            
            for booking in bookings:
                status_emoji = {
                    "pending": "⏳",
                    "confirmed": "✅",
                    "cancelled": "❌",
                    "completed": "✔️"
                }.get(booking["status"], "📅")
                
                response["content"] += f"\n{status_emoji} **{booking['service_name']}**"
                response["content"] += f"\n   📅 {booking['booking_date'].strftime('%d/%m/%Y')} alle {booking['booking_time']}"
                response["content"] += f"\n   Stato: {booking['status']}\n"
            
            response["suggested_actions"] = [
                {"type": "cancel_booking", "label": "Cancella prenotazione"},
                {"type": "modify_booking", "label": "Modifica prenotazione"},
                {"type": "view_details", "label": "Vedi dettagli"}
            ]
        else:
            response["content"] = "Non hai prenotazioni attive. Vuoi prenotare un servizio?"
            response["suggested_actions"] = [
                {"type": "new_booking", "label": "Nuova prenotazione"},
                {"type": "search_services", "label": "Cerca servizi"}
            ]
        
        return response
    
    async def _generate_greeting_response(self, user_data: Dict[str, Any]) -> str:
        """
        Genera risposta di saluto
        """
        name = user_data.get("full_name", "").split()[0] if user_data.get("full_name") else ""
        
        greetings = [
            f"Ciao{' ' + name if name else ''}! Come posso aiutarti oggi?",
            f"Benvenuto{' ' + name if name else ''} su commIT! Cerchi un servizio particolare?",
            f"Salve{' ' + name if name else ''}! Sono qui per aiutarti a trovare e prenotare servizi. Cosa ti serve?",
            "Ciao! Posso aiutarti a trovare ristoranti, parrucchieri, negozi e molto altro. Cosa cerchi?"
        ]
        
        import random
        return random.choice(greetings)
    
    async def _generate_generic_response(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> str:
        """
        Genera risposta generica usando AI
        """
        try:
            # Costruisci contesto conversazione
            context_str = ""
            if context:
                context_str = f"\n\nContesto conversazione: {json.dumps(context, indent=2)}"
            
            messages = [
                {"role": "system", "content": self.system_prompt + context_str},
                {"role": "user", "content": message}
            ]
            
            response = await openai_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Errore generazione risposta generica: {e}")
            return "Mi dispiace, non ho capito bene. Posso aiutarti a cercare servizi, fare prenotazioni o gestire quelle esistenti. Cosa preferisci?"


# Funzioni utility per test
async def test_ai_agent():
    """
    Test dell'AI Agent
    """
    agent = AIAgent()
    
    # Test intent analysis
    test_messages = [
        "Vorrei prenotare un ristorante per stasera",
        "Cerco un parrucchiere a Milano",
        "Quali sono i migliori ristoranti?",
        "Voglio cancellare la mia prenotazione",
        "Ciao!",
        "Come funziona l'app?"
    ]
    
    print("=== TEST ANALISI INTENT ===")
    for msg in test_messages:
        intent = await agent._analyze_intent(msg)
        print(f"Messaggio: {msg}")
        print(f"Intent: {intent}\n")
    
    # Test entity extraction
    print("\n=== TEST ESTRAZIONE ENTITÀ ===")
    test_message = "Cerco un ristorante a Milano per domani sera alle 20:00 per 4 persone"
    entities = await agent._extract_entities(test_message)
    print(f"Messaggio: {test_message}")
    print(f"Entità: {json.dumps(entities, indent=2)}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_ai_agent())
