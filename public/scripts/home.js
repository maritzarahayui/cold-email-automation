// Fetch data from the backend API
fetch('/api/books')
    .then(response => response.json())
    .then(data => {
        // Display the list of books on the HTML page
        const booksList = document.getElementById('books-list');

        data.books.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.innerHTML = `
                <h2>${book.name}</h2>
                <p>Author: ${book.author}</p>
                <p>Summary: ${book.summary}</p>
                <p>Publisher: ${book.publisher}</p>
            `;
            booksList.appendChild(bookElement);
        });
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
