const firebaseConfig = {
    apiKey: "AIzaSyCvQjYp4bJLH5RP-mdsvuX-SZjgHlRdBu0",
    authDomain: "mit-herz-app.firebaseapp.com",
    projectId: "mit-herz-app",
    storageBucket: "mit-herz-app.firebasestorage.app",
    messagingSenderId: "474860759352",
    appId: "1:474860759352:web:c0dc577cf58a60dca339cd"
};

let dbStore = null;
let isFirebaseActive = false;

try {
    if (firebaseConfig.apiKey !== "DUMMY_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        dbStore = firebase.firestore();
        isFirebaseActive = true;
        console.log("Firebase initialized");
    } else {
        console.warn("Firebase config is DUMMY. Using only LocalStorage.");
    }
} catch (e) {
    console.error("Firebase init error:", e);
}

const COL_CLIENTS = "clients";
const COL_EMPLOYEES = "employees";
const COL_RECORDS = "records";
const COL_SCHEDULES = "schedules";
const COL_NOTIFICATIONS = "notifications";
const COL_SETTINGS = "settings";
const COL_ABSENCE_REQUESTS = "absenceRequests";
const COL_DRIVING_RECORDS = "drivingRecords";

async function syncFromFirebase() {
    if (!isFirebaseActive) return;
    
    try {
        const data = { clients: [], employees: [], records: [], schedules: [], notifications: [], absenceRequests: [], adminPin: '0000', drivingRecords: [], employeeNotes: {} };
        
        const cSnap = await dbStore.collection(COL_CLIENTS).get();
        cSnap.forEach(d => data.clients.push(d.data()));
        
        const eSnap = await dbStore.collection(COL_EMPLOYEES).get();
        eSnap.forEach(d => data.employees.push(d.data()));
        
        const rSnap = await dbStore.collection(COL_RECORDS).get();
        rSnap.forEach(d => data.records.push(d.data()));

        const sSnap = await dbStore.collection(COL_SCHEDULES).get();
        sSnap.forEach(d => data.schedules.push(d.data()));

        const nSnap = await dbStore.collection(COL_NOTIFICATIONS).get();
        nSnap.forEach(d => data.notifications.push(d.data()));
        
        const arSnap = await dbStore.collection(COL_ABSENCE_REQUESTS).get();
        arSnap.forEach(d => data.absenceRequests.push(d.data()));
        
        const drSnap = await dbStore.collection(COL_DRIVING_RECORDS).get();
        drSnap.forEach(d => data.drivingRecords.push(d.data()));
        
        const notesSnap = await dbStore.collection('employeeNotes').get();
        notesSnap.forEach(d => { data.employeeNotes[d.id] = d.data().text; });
        
        const vertSnap = await dbStore.collection('vertretungDecisions').get();
        const vertretungen = [];
        vertSnap.forEach(d => vertretungen.push(d.data()));
        localStorage.setItem('haushaltshilfe_vertretungen', JSON.stringify(vertretungen));
        
        const exSnap = await dbStore.collection('exceptions').get();
        exSnap.forEach(d => { if(!data.exceptions) data.exceptions=[]; data.exceptions.push(d.data()); });
        
        const settingsSnap = await dbStore.collection(COL_SETTINGS).doc('adminPin').get();
        if (settingsSnap.exists) {
            data.adminPin = settingsSnap.data().value || '0000';
        }
        
        localStorage.setItem('haushaltshilfe_db', JSON.stringify(data));
        console.log("Synced FROM Firebase successfully");
    } catch (e) {
        console.error("Error syncing from firebase:", e);
    }
}

async function syncToFirebase(data) {
    if (!isFirebaseActive) return;
    
    try {
        // Upload everything to ensure it's in sync
        for(let c of data.clients || []) {
            await dbStore.collection(COL_CLIENTS).doc(c.id).set(c);
        }
        for(let e of data.employees || []) {
            await dbStore.collection(COL_EMPLOYEES).doc(e.id).set(e);
        }
        for(let r of data.records || []) {
            await dbStore.collection(COL_RECORDS).doc(r.id).set(r);
        }
        for(let s of data.schedules || []) {
            await dbStore.collection(COL_SCHEDULES).doc(s.id).set(s);
        }
        for(let n of data.notifications || []) {
            await dbStore.collection(COL_NOTIFICATIONS).doc(n.id).set(n);
        }
        for(let ar of data.absenceRequests || []) {
            await dbStore.collection(COL_ABSENCE_REQUESTS).doc(ar.id).set(ar);
        }
        for(let dr of data.drivingRecords || []) {
            await dbStore.collection(COL_DRIVING_RECORDS).doc(dr.id).set(dr);
        }
        if (data.employeeNotes) {
            for (let [key, val] of Object.entries(data.employeeNotes)) {
                await dbStore.collection('employeeNotes').doc(key).set({text: val});
            }
        }
        try {
            const vertretungen = JSON.parse(localStorage.getItem('haushaltshilfe_vertretungen')) || [];
            for (let v of vertretungen) {
                if (v.id) await dbStore.collection('vertretungDecisions').doc(v.id).set(v);
            }
        } catch(e) {}
        for(let ex of data.exceptions || []) {
            await dbStore.collection('exceptions').doc(ex.id).set(ex);
        }
        await dbStore.collection(COL_SETTINGS).doc('adminPin').set({ value: data.adminPin || '0000' });
        console.log("Synced TO Firebase successfully");
    } catch (e) {
        console.error("Error syncing to firebase:", e);
    }
}

function saveToFirebase(collection, id, docData) {
    if (!isFirebaseActive) return;
    dbStore.collection(collection).doc(id).set(docData).catch(e => console.error(e));
}

function deleteFromFirebase(collection, id) {
    if (!isFirebaseActive) return;
    dbStore.collection(collection).doc(id).delete().catch(e => console.error(e));
}
