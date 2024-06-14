const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

async function storeData(collectionName, data) {
    console.log(`Storing data to Firestore in collection ${collectionName}:`, data);
    
    const database = db.collection(collectionName);
    const result = await database.add(data);
    console.log("Firestore write result:", result.id);

    return result;
}

async function updateData(collectionName, id) {
    const result = await db.collection(collectionName).doc(String(id)).update({
        status: 'sent',
    });
    return result;
}

module.exports = { storeData, updateData, db };
