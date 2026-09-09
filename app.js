pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let activePageFlip = null;

// --- CONFIGURATION ---
const GITHUB_USER = 'hom-jy-87';
const GITHUB_REPO = 'report';

// Load library immediately on startup
document.addEventListener('DOMContentLoaded', loadPDFLibrary);

async function loadAndOpenPDF(pdfPath, title) {
    document.querySelector('header').style.display = 'none';
    document.getElementById('libraryView').style.display = 'none';
    document.getElementById('readerView').style.display = 'flex';
    document.getElementById('readerTitle').textContent = title;

    const bookContainer = document.getElementById('book');
    bookContainer.innerHTML = '';
    
    // 1. Hide the book container while it builds in the background
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
            size: "fixed",
            minWidth: 300,
            maxWidth: 800,
            minHeight: 400,
            maxHeight: 1000,
            showCover: false,
            drawShadow: true,
            maxShadowOpacity: 0.5,
            mobileScrollSupport: true,
            usePortrait: true,
            flippingTime: 600
        });

        activePageFlip.loadFromHTML(document.querySelectorAll('.page'));

        // 2. Once the flipbook engine is locked in, reveal it instantly
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
    
    document.getElementById('book').innerHTML = '';
    
    // Hide reader, bring back the header and the library bookshelf
    document.getElementById('readerView').style.display = 'none';
    document.querySelector('header').style.display = 'block';
    document.getElementById('libraryView').style.display = 'grid';
}
    const bookContainer = document.getElementById('book');
    bookContainer.innerHTML = '';

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

        // Single-page portrait reader configuration
        activePageFlip = new St.PageFlip(bookContainer, {
            width: 500,
            height: 700,
            size: "fixed",
            minWidth: 300,
            maxWidth: 800,
            minHeight: 400,
            maxHeight: 1000,
            showCover: false,
            drawShadow: true,
            maxShadowOpacity: 0.5,
            mobileScrollSupport: true,
            usePortrait: true, // Forces single-page layout
            flippingTime: 600
        });

        activePageFlip.loadFromHTML(document.querySelectorAll('.page'));

    } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Could not load the PDF file.");
    }
}

function closeReader() {
    // Safely destroy the flipbook instance if it exists
    try {
        if (activePageFlip) {
            activePageFlip.destroy();
            activePageFlip = null;
        }
    } catch (e) {
        console.log("Cleanup note:", e);
    }
    
    // Clear out the reader contents
    document.getElementById('book').innerHTML = '';
    
    // Explicitly hide the reader and show the library shelf
    document.getElementById('readerView').style.display = 'none';
    document.getElementById('libraryView').style.display = 'grid';
}
