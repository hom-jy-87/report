pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let activePageFlip = null;

// --- CONFIGURATION ---
const GITHUB_USER = 'hom-jy-87';
const GITHUB_REPO = 'report';

// Load library immediately on startup
document.addEventListener('DOMContentLoaded', loadPDFLibrary);

async function loadPDFLibrary() {
    const libraryGrid = document.getElementById('libraryView');
    let pdfFiles = [];

    try {
        const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/pdfs`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
            const data = await response.json();
            pdfFiles = data
                .filter(file => file.name.endsWith('.pdf'))
                .map(file => ({ name: file.name, url: file.download_url }));
        }
    } catch (e) {
        console.log("API fetch skipped, using fallback.");
    }

    // Fallback if offline or API fails
    if (pdfFiles.length === 0) {
        const localTestFiles = ['2026-09-04.pdf', '2026-08-28.pdf', '2026-08-21.pdf'];
        pdfFiles = localTestFiles.map(filename => ({
            name: filename,
            url: `pdfs/${filename}`
        }));
    }

    pdfFiles.sort((a, b) => b.name.localeCompare(a.name));
    libraryGrid.innerHTML = '';

    if (pdfFiles.length === 0) {
        libraryGrid.innerHTML = '<p style="color: #999;">No PDF documents found.</p>';
        return;
    }

    pdfFiles.forEach(file => {
        const fileNameWithoutExt = file.name.replace('.pdf', '');
        const formattedTitle = formatDateString(fileNameWithoutExt);

        const card = document.createElement('div');
        card.className = 'doc-card';
        card.onclick = () => loadAndOpenPDF(file.url, formattedTitle);

        card.innerHTML = `
            <h3>${formattedTitle}</h3>
            <span class="read-btn">Open Book &rarr;</span>
        `;

        libraryGrid.appendChild(card);
    });
}

function formatDateString(dateStr) {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

async function loadAndOpenPDF(pdfPath, title) {
    document.querySelector('header').style.display = 'none';
    document.getElementById('libraryView').style.display = 'none';
    document.getElementById('readerView').style.display = 'flex';
    document.getElementById('readerTitle').textContent = title;

    const bookContainer = document.getElementById('book');
    bookContainer.innerHTML = '';
    bookContainer.style.opacity = '0';

    try {
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            pageDiv.appendChild(canvas);
            bookContainer.appendChild(pageDiv);
        }

        activePageFlip = new St.PageFlip(bookContainer, {
            width: 500,
            height: 700,
            size: "stretch",
            minWidth: 300,
            maxWidth: 1000,
            minHeight: 400,
            maxHeight: 1400,
            showCover: false,
            drawShadow: true,
            maxShadowOpacity: 0.4,
            mobileScrollSupport: false, // Disables page scrolling up/down so swiping turns pages cleanly
            usePortrait: true,
            flippingTime: 400
        });

        activePageFlip.loadFromHTML(document.querySelectorAll('.page'));
        bookContainer.style.opacity = '1';

    } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Could not load the PDF file.");
        bookContainer.style.opacity = '1';
    }
}

function closeReader() {
    try {
        if (activePageFlip) {
            activePageFlip.destroy();
            activePageFlip = null;
        }
    } catch (e) {
        console.log("Cleanup note:", e);
    }
    
    // NUCLEAR OPTION: Recreate the book container entirely to strip all lingering Page-Flip DOM wrappers
    const viewport = document.querySelector('.book-viewport');
    const oldBook = document.getElementById('book');
    if (oldBook) {
        oldBook.remove();
    }
    
    const newBook = document.createElement('div');
    newBook.id = 'book';
    newBook.style.opacity = '0';
    viewport.appendChild(newBook);
    
    // Hide reader view, restore header, and show bookshelf
    document.getElementById('readerView').style.display = 'none';
    document.querySelector('header').style.display = 'block';
    document.getElementById('libraryView').style.display = 'grid';
}
