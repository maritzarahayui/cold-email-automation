const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

async function storeData(id, data) {
    console.log("Storing data to Firestore:", id, data);
    
    const database = db.collection('database');
    const result = await database.doc(id).set(data);
    console.log("Firestore write result:", result);

    return result;
}

module.exports = { storeData, db };
