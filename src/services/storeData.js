const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

async function storeData(collectionName, id, data) {
    console.log(`Storing data to Firestore in collection ${collectionName}:`, id, data);
    
    const database = db.collection(collectionName);
    const result = await database.doc(id).set(data);
    console.log("Firestore write result:", result);

    return result;
}

module.exports = { storeData, db };
