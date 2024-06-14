const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

async function storeData(collectionName, data) {
    console.log(`Storing data to Firestore in collection ${collectionName}:`, data);
    
    const database = db.collection(collectionName);
    const result = await database.add(data);
    console.log("Firestore write result:", result.id);

    return result;
}

function setId(collectionName) {
    var emailId = db.collection(collectionName).doc().id;    
    console.log("Firestore set id:", emailId);
    return emailId;
}

async function setData(collectionName, data) {
    console.log(`DATANYA KYK APA SI`, data);
    const id = String(data.id)
    const result = await db.collection(collectionName).doc(id).set(data);
    console.log(`Set new data to email id ${data.id}:`, data);
    return result;
}

async function updateData(collectionName, id) {
    console.log("HAIIII AKU DI TRACKERRR ASYNNNCCCCC")
    const result = await db.collection(collectionName).doc(String(id)).update({
        opened: true,
        openedAt: Firestore.Timestamp.now(),
    });
    return result;
}

module.exports = { storeData, setId, setData, updateData, db };
