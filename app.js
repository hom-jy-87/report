// Configure PDF.js worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

let activePageFlip = null;

// --- CONFIGURATION ---
// Replace these with your actual GitHub username and repository name
const GITHUB_USER = 'YOUR_GITHUB_USERNAME';
const GITHUB_REPO = 'YOUR_REPO_NAME';

// Automatically load the library when the page opens
document.addEventListener('DOMContentLoaded', fetchPDFLibrary);

async function fetchPDFLibrary() {
    const libraryGrid = document.getElementById('libraryView');
    
    try {
        // Fetch the file list from the GitHub repository API
        const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/pdfs`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error("Could not fetch repository contents.");
        
        const files = await response.json();
        
        // Filter only .pdf files matching yyyy-mm-dd format
        const pdfFiles = files.filter(file => file.name.endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            libraryGrid.innerHTML = '<p style="color: #999;">No PDF documents found in the folder.</p>';
            return;
        }

        // Sort files by filename in descending order (newest dates first)
        pdfFiles.sort((a, b) => b.name.localeCompare(a.name));

        // Clear loading message
        libraryGrid.innerHTML = '';

        // Build a card for each PDF automatically
        pdfFiles.forEach(file => {
            const fileNameWithoutExt = file.name.replace('.pdf', ''); // e.g. "2026-09-04"
            const formattedTitle = formatDateString(fileNameWithoutExt); // e.g. "September 4, 2026"

            const card = document.createElement('div');
            card.className = 'doc-card';
            card.onclick = () => loadAndOpenPDF(file.download_url, formattedTitle);

            card.innerHTML = `
                <h3>${formattedTitle}</h3>
                <span class="read-btn">Open Book &rarr;</span>
            `;

            libraryGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading library:", error);
        // Fallback for local testing where GitHub API won't return live data
        libraryGrid.innerHTML = '<p style="color: #ff9999;">Note: GitHub API folder scanning requires hosting on GitHub Pages. (Local fallback active).</p>';
    }
}

// Helper function to turn "2026-09-04" into "September 4, 2026"
function formatDateString(dateStr) {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr; // Fallback if format differs
    
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
            width: 450,
            height: 650,
            size: "fixed",
            minWidth: 300,
            maxWidth: 700,
            minHeight: 400,
            maxHeight: 900,
            showCover: false,
            drawShadow: true,
            maxShadowOpacity: 0.5,
            mobileScrollSupport: true
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