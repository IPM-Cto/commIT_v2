// Test Helper per verificare il corretto funzionamento del routing

/**
 * MANUALE DI TEST - Sistema di Routing CommIT
 * 
 * Esegui questi test in ordine per verificare che tutto funzioni correttamente
 */

// =============================================================================
// TEST 1: Verifica localStorage dopo registrazione
// =============================================================================

console.log('🧪 TEST 1: Verifica localStorage');

// Apri DevTools Console (F12) dopo completare registrazione e digita:
const userData = JSON.parse(localStorage.getItem('user_data'));
const userType = localStorage.getItem('user_type');

console.log('User Data:', userData);
console.log('User Type:', userType);

// ✅ RISULTATO ATTESO:
// userData dovrebbe contenere: { _id, email, user_type, full_name, ... }
// userType dovrebbe essere: "customer" oppure "provider"

// =============================================================================
// TEST 2: Verifica redirect dopo registrazione CUSTOMER
// =============================================================================

console.log('🧪 TEST 2: Registrazione Customer');

// 1. Vai su http://localhost:3000/register
// 2. Seleziona "Cliente"
// 3. Compila tutti i campi
// 4. Clicca "Completa registrazione"
// 5. Osserva la console per:
console.log('📤 Invio registrazione: { user_type: "customer", ... }');
console.log('✅ Redirect a CustomerDashboard');

// 6. Verifica che la URL sia: http://localhost:3000/dashboard/customer
// 7. Verifica che vedi la CustomerDashboard

// ✅ PASS: Se vedi CustomerDashboard senza loading intermedi
// ❌ FAIL: Se vedi loading screen doppio o redirect a /register

// =============================================================================
// TEST 3: Verifica redirect dopo registrazione PROVIDER
// =============================================================================

console.log('🧪 TEST 3: Registrazione Provider');

// 1. Logout (se già loggato)
// 2. Vai su http://localhost:3000/register
// 3. Seleziona "Provider"
// 4. Compila tutti i campi (incluso indirizzo!)
// 5. Clicca "Completa registrazione"
// 6. Osserva la console per:
console.log('📤 Invio registrazione: { user_type: "provider", business_name: "...", ... }');
console.log('✅ Redirect a ProviderDashboard');

// 7. Verifica che la URL sia: http://localhost:3000/dashboard/provider
// 8. Verifica che vedi la ProviderDashboard con nome attività

// ✅ PASS: Se vedi ProviderDashboard immediatamente
// ❌ FAIL: Se vedi errori o redirect sbagliato

// =============================================================================
// TEST 4: Verifica accesso diretto a dashboard specifica
// =============================================================================

console.log('🧪 TEST 4: Accesso diretto');

// SCENARIO A: Accesso con dati in localStorage
// 1. Assicurati di avere user_data in localStorage (vedi TEST 1)
// 2. Apri nuova tab e vai direttamente a:
//    - http://localhost:3000/dashboard/customer (se sei customer)
//    - http://localhost:3000/dashboard/provider (se sei provider)
// 3. Verifica che la dashboard corretta appare SUBITO

// ✅ PASS: Dashboard appare immediatamente
// ❌ FAIL: Vedi LoadingScreen o redirect

// SCENARIO B: Accesso senza autenticazione
// 1. Apri finestra in incognito
// 2. Vai a http://localhost:3000/dashboard/customer
// 3. Verifica redirect a /login

// ✅ PASS: Redirect a login page
// ❌ FAIL: Vedi dashboard o errore 401

// =============================================================================
// TEST 5: Verifica route /dashboard generica
// =============================================================================

console.log('🧪 TEST 5: Route /dashboard generica');

// 1. Vai a http://localhost:3000/dashboard (senza /customer o /provider)
// 2. Osserva la console:
console.log('✅ Redirect a /dashboard/customer');
// oppure
console.log('✅ Redirect a /dashboard/provider');

// 3. Verifica che sei reindirizzato automaticamente alla dashboard corretta

// ✅ PASS: Redirect automatico basato su user_type
// ❌ FAIL: Rimani su /dashboard o vedi errore

// =============================================================================
// TEST 6: Verifica gestione errori durante registrazione
// =============================================================================

console.log('🧪 TEST 6: Gestione errori');

// SCENARIO A: Errore di rete
// 1. Disattiva backend (ferma server Python)
// 2. Prova a registrarti
// 3. Verifica che vedi messaggio di errore
// 4. Verifica che NON vieni reindirizzato

// ✅ PASS: Messaggio "Impossibile connettersi al server"
// ❌ FAIL: Crash o redirect nonostante errore

// SCENARIO B: Dati mancanti
// 1. In Register.js, prova a submitare con campi vuoti
// 2. (Il form dovrebbe bloccare il submit se campi required sono vuoti)

// SCENARIO C: 401 Unauthorized
// 1. Modifica temporaneamente il token in Register.js per essere invalido
// 2. Prova a registrarti
// 3. Verifica che vedi errore di autenticazione

// =============================================================================
// TEST 7: Verifica compatibilità browser
// =============================================================================

console.log('🧪 TEST 7: Cross-browser');

// Testa l'intera flow di registrazione su:
// - Chrome
// - Firefox
// - Safari (se disponibile)
// - Edge

// Verifica che in tutti i browser:
// - localStorage funziona
// - Redirect funziona
// - Console logs appaiono correttamente

// =============================================================================
// TEST 8: Verifica pulizia localStorage
// =============================================================================

console.log('🧪 TEST 8: Pulizia dati');

// 1. Registrati con successo
// 2. Apri DevTools Console e digita:
localStorage.clear();

// 3. Visita http://localhost:3000/dashboard
// 4. Verifica che vieni reindirizzato a /register

// ✅ PASS: Redirect a /register
// ❌ FAIL: Crash o loop infinito

// 5. Ricarica la pagina (F5)
// 6. UserContext dovrebbe chiamare fetchUserData()
// 7. Se sei autenticato con Auth0, i dati vengono recuperati dal backend

// =============================================================================
// TEST 9: Performance Check
// =============================================================================

console.log('🧪 TEST 9: Performance');

// 1. Apri DevTools → Network tab
// 2. Completa registrazione
// 3. Conta quante chiamate API vengono fatte:

// ✅ RISULTATO ATTESO:
// - 1x POST /api/auth/register
// - 0x GET /api/auth/me (IMPORTANTE: questo non dovrebbe esserci!)
// - Totale: 1 chiamata

// ❌ RISULTATO ERRATO:
// - 1x POST /api/auth/register
// - 1x GET /api/auth/me
// - Totale: 2 chiamate (troppo!)

console.log('Numero chiamate API:', performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/'))
  .length
);

// =============================================================================
// TEST 10: User Experience Timing
// =============================================================================

console.log('🧪 TEST 10: Timing UX');

// Misura il tempo dal click "Completa registrazione" al rendering dashboard

// 1. Apri DevTools Console
// 2. Prima di clickare "Completa registrazione", digita:
const startTime = performance.now();

// 3. Clicca "Completa registrazione"
// 4. Quando vedi la dashboard, digita:
const endTime = performance.now();
const totalTime = endTime - startTime;
console.log(`⏱️ Tempo totale: ${totalTime}ms`);

// ✅ BUONO: < 2000ms (2 secondi)
// ⚠️ ACCETTABILE: 2000-5000ms
// ❌ LENTO: > 5000ms

// =============================================================================
// UTILITY: Debug Helper
// =============================================================================

// Copia questa funzione nella console per debug rapido:
function debugCommitRouting() {
  console.log('=== COMMIT ROUTING DEBUG ===');
  
  const userData = localStorage.getItem('user_data');
  const userType = localStorage.getItem('user_type');
  
  console.log('1. localStorage data:');
  console.log('   - user_data:', userData ? JSON.parse(userData) : 'VUOTO');
  console.log('   - user_type:', userType || 'VUOTO');
  
  console.log('\n2. Current location:');
  console.log('   - pathname:', window.location.pathname);
  console.log('   - search:', window.location.search);
  console.log('   - hash:', window.location.hash);
  
  console.log('\n3. Auth0 state:');
  // Questo funziona solo se hai accesso al componente React
  console.log('   - Controlla manualmente in React DevTools');
  
  console.log('\n4. Network calls:');
  const apiCalls = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('/api/'));
  console.log(`   - Totale chiamate API: ${apiCalls.length}`);
  apiCalls.forEach(call => {
    console.log(`     • ${call.name}`);
  });
  
  console.log('\n5. Cookies & Storage:');
  console.log('   - localStorage keys:', Object.keys(localStorage));
  console.log('   - sessionStorage keys:', Object.keys(sessionStorage));
  
  console.log('\n========================\n');
}

// Per usare il debug helper, copia e incolla questa funzione nella console
// poi digita: debugCommitRouting()

// =============================================================================
// CHECKLIST FINALE
// =============================================================================

/*
📋 CHECKLIST COMPLETA - Da verificare prima del deploy

[ ] TEST 1 - localStorage contiene user_data e user_type dopo registrazione
[ ] TEST 2 - Cliente redirect a /dashboard/customer
[ ] TEST 3 - Provider redirect a /dashboard/provider  
[ ] TEST 4 - Accesso diretto alle dashboard funziona
[ ] TEST 5 - Route /dashboard generica reindirizza correttamente
[ ] TEST 6 - Errori mostrati correttamente senza crash
[ ] TEST 7 - Funziona su Chrome, Firefox, Safari, Edge
[ ] TEST 8 - Pulizia localStorage gestita correttamente
[ ] TEST 9 - Solo 1 chiamata API durante registrazione
[ ] TEST 10 - Tempo di redirect < 2 secondi

RISULTATI:
- Passati: __/10
- Falliti: __/10

NOTE:
_____________________________________________
_____________________________________________
_____________________________________________

*/

// =============================================================================
// ESEMPI DI OUTPUT CONSOLE ATTESI
// =============================================================================

/*

ESEMPIO 1: Registrazione Customer Successful
---------------------------------------------
📤 Invio registrazione: {
  user_type: "customer",
  full_name: "Mario Rossi",
  phone: "+39 333 1234567",
  preferences: ["Ristoranti", "Shopping"]
}
✅ Response ricevuta: {
  success: true,
  user: {
    _id: "507f1f77bcf86cd799439011",
    email: "mario@example.com",
    user_type: "customer",
    full_name: "Mario Rossi",
    ...
  }
}
✅ Redirect a CustomerDashboard
🎯 Navigating to: /dashboard/customer


ESEMPIO 2: Registrazione Provider Successful
---------------------------------------------
📤 Invio registrazione: {
  user_type: "provider",
  full_name: "Giuseppe Verdi",
  phone: "+39 333 7654321",
  business_name: "Pizzeria da Giuseppe",
  service_category: "restaurant",
  address: {
    street: "Via Roma 1",
    city: "Milano",
    postal_code: "20121",
    province: "MI"
  }
}
✅ Response ricevuta: {
  success: true,
  user: {
    _id: "507f1f77bcf86cd799439012",
    email: "giuseppe@example.com",
    user_type: "provider",
    business_name: "Pizzeria da Giuseppe",
    ...
  }
}
✅ Redirect a ProviderDashboard
🎯 Navigating to: /dashboard/provider


ESEMPIO 3: Errore durante registrazione
----------------------------------------
📤 Invio registrazione: { ... }
❌ Errore registrazione: Error: Network Error
❌ Messaggio mostrato: "Impossibile connettersi al server"
⚠️ Rimasto su pagina registrazione (corretto!)


ESEMPIO 4: Accesso a /dashboard generica
-----------------------------------------
🔍 DashboardRouter: Checking user type...
✅ userData found: { user_type: "customer", ... }
✅ Redirect a /dashboard/customer
🎯 Navigating to: /dashboard/customer

*/

// =============================================================================
// SCRIPT DI TEST AUTOMATICO (OPZIONALE)
// =============================================================================

// Questo script può essere eseguito in console per test automatici rapidi
async function runAutomatedTests() {
  console.log('🚀 Avvio test automatici...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: localStorage
  console.log('Test 1: localStorage...');
  const userData = localStorage.getItem('user_data');
  const userType = localStorage.getItem('user_type');
  
  if (userData && userType) {
    console.log('✅ PASS: localStorage contiene dati utente');
    passed++;
  } else {
    console.log('❌ FAIL: localStorage vuoto');
    failed++;
  }
  
  // Test 2: user_type valido
  console.log('\nTest 2: user_type valido...');
  const validTypes = ['customer', 'provider', 'admin'];
  
  if (validTypes.includes(userType)) {
    console.log(`✅ PASS: user_type = "${userType}"`);
    passed++;
  } else {
    console.log(`❌ FAIL: user_type non valido = "${userType}"`);
    failed++;
  }
  
  // Test 3: Struttura userData
  console.log('\nTest 3: Struttura userData...');
  if (userData) {
    const parsed = JSON.parse(userData);
    const requiredFields = ['_id', 'email', 'user_type', 'full_name'];
    const hasAllFields = requiredFields.every(field => field in parsed);
    
    if (hasAllFields) {
      console.log('✅ PASS: userData ha tutti i campi richiesti');
      passed++;
    } else {
      console.log('❌ FAIL: userData manca alcuni campi');
      console.log('Campi trovati:', Object.keys(parsed));
      failed++;
    }
  } else {
    console.log('⏭️ SKIP: userData non disponibile');
  }
  
  // Test 4: Current route
  console.log('\nTest 4: Current route...');
  const path = window.location.pathname;
  const validPaths = ['/', '/register', '/login', '/dashboard', '/dashboard/customer', '/dashboard/provider', '/chat'];
  
  if (validPaths.includes(path)) {
    console.log(`✅ PASS: Route valida = "${path}"`);
    passed++;
  } else {
    console.log(`⚠️ WARNING: Route non standard = "${path}"`);
  }
  
  // Test 5: API calls count
  console.log('\nTest 5: API calls count...');
  const apiCalls = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('/api/auth/'));
  
  console.log(`📊 Chiamate API auth: ${apiCalls.length}`);
  if (apiCalls.length <= 2) {
    console.log('✅ PASS: Numero chiamate API accettabile');
    passed++;
  } else {
    console.log('⚠️ WARNING: Troppe chiamate API');
  }
  
  // Riepilogo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RIEPILOGO TEST');
  console.log('='.repeat(50));
  console.log(`✅ Passati: ${passed}`);
  console.log(`❌ Falliti: ${failed}`);
  console.log(`📈 Percentuale successo: ${(passed / (passed + failed) * 100).toFixed(0)}%`);
  console.log('='.repeat(50));
}

// Per eseguire i test automatici, copia questa funzione in console e digita:
// runAutomatedTests()

// =============================================================================
// FINE FILE TEST
// =============================================================================

console.log('✅ File di test caricato. Segui le istruzioni per testare il routing.');
