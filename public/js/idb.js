let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(e) {
    const db = e.target.result;
    db.createObjectStore('new_txn', { autoIncrement: true });
};

request.onsuccess = function(e) {
    db = e.target.result;
    if (navigator.onLine) {
        uploadTxns();
    }
};

request.onerror = function(e) {
    console.log(e.target.errorCode);
}

function saveRecord(record) {
    const transaction = db.transaction(['new_txn'], 'readwrite');
    const txnObjectStore = transaction.objectStore('new_txn');
    txnObjectStore.add(record);
}


function uploadTxns() {
    const transaction = db.transaction(['new_txn'], 'readwrite');

    const txnObjectStore = transaction.objectStore('new_txn');
    const getAll = txnObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                credentials: "include"
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error (serverResponse);
                }
                const transaction = db.transaction(['new_txn'], 'readwrite');

                const txnObjectStore = transaction.objectStore('new_txn');
                txnObjectStore.clear();

                alert('All saved transactions have been submitted!')
            })
            .catch(err => {
                console.log(err);
            });    
        }
    }
}

window.addEventListener('online', uploadTxns)