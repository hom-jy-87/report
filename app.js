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
        console.log("Local test mode: falling back to local files.");
    }

    // Local Fallback if testing offline
    if (pdfFiles.length === 0) {
        const localTestFiles = ['2026-09-04.pdf', '2026-08-28.pdf', '2026-08-21.pdf'];
        pdfFiles = localTestFiles.map(filename => ({
            name: filename,
            url: `pdfs/${filename}`
        }));
    }

    pdfFiles.sort((a, b) => b.name.localeCompare(a.name));
    libraryGrid.innerHTML = '';

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
    document.getElementById('libraryView').style.display = 'none';
    document.getElementById('readerView').style.display = 'flex';
    document.getElementById('readerTitle').textContent = title;

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

        activePageFlip = new St.PageFlip(bookContainer, {
            width: 500,   // Width of the single page
            height: 700,  // Height of the single page
            size: "fixed",
            minWidth: 300,
            maxWidth: 800,
            minHeight: 400,
            maxHeight: 1000,
            showCover: false,
            drawShadow: true,
            maxShadowOpacity: 0.5,
            mobileScrollSupport: true,
            usePortrait: true, // Forces single-page portrait layout
            flippingTime: 600  // Speed of the flip animation in milliseconds
        });

        activePageFlip.loadFromHTML(document.querySelectorAll('.page'));

    } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Could not load the PDF file.");
    }
}

function closeReader() {
    if (activePageFlip) {
        activePageFlip.destroy();
        activePageFlip = null;
    }
    
    document.getElementById('book').innerHTML = '';
    document.getElementById('readerView').style.display = 'none';
    document.getElementById('libraryView').style.display = 'grid';
}
