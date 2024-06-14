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
    try {
      console.log(`Updating document with ID ${id}`);
      const result = await db.collection(collectionName).doc(id).update({
        status: 'sent',
      });
      console.log(`Document with ID ${id} successfully updated`);
      return result;
    } catch (error) {
      console.error(`Failed to update document with ID ${id}:`, error);
      throw error;
    }
}

module.exports = { storeData, updateData, db };
