const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { db } = require('./database/index'); // Import the database logic
const { dialog, app } = require('electron');

async function generatePDF() {
    const doc = new PDFDocument();
    const filePath = path.join(app.getPath('desktop'), 'Lista_de_Musicas.pdf');
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(18).text('Lista de Musicas', { align: 'center' });

    const table = {
        headers: ['Identificador', 'Artista', 'Musica'],
        pages: {
            page1: []
        }
    };
    const rows = [];
    db.all('SELECT identificador, artista, nome FROM Musicas ORDER BY artista', (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        let page = 0
        for (const [index, row] of rows.entries()) {
            if (index % 15 === 0) {
                page++
            }
            if (!table.pages[`page${page}`]) {
                table.pages[`page${page}`] = []
            }
            table.pages[`page${page}`].push([row.identificador, row.artista, row.nome])
        }

        // Define table styling
        let tableTop = 150; // Starting Y position of the table
        const cellPadding = 10; // Padding inside each cell
        const rowHeight = 30; // Height of each row
        const columnWidth = 150; // Width of each column
        const colWidths = [150, 150, 250]
        let pageNumber = 0
        for (const key in table.pages) {
            if (pageNumber > 0) {
                tableTop = 50
                doc.addPage()
            }

            doc.font('Helvetica-Bold').fontSize(12);
            table.headers.forEach((header, i) => {
                const colWidth = colWidths[i]
                doc
                    .rect(50 + i * columnWidth, tableTop, colWidth, rowHeight)
                    .stroke()
                    .text(header, 50 + i * columnWidth + cellPadding, tableTop + cellPadding, {
                        width: colWidth,
                        align: 'left',
                    });
            });

            doc.font('Helvetica').fontSize(10);
            table.pages[key].forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    const colWidth = colWidths[colIndex]
                    doc
                        .rect(50 + colIndex * columnWidth, tableTop + (rowIndex + 1) * rowHeight, colWidth, rowHeight)
                        .stroke()
                        .text(cell, 50 + colIndex * columnWidth + cellPadding, tableTop + (rowIndex + 1) * rowHeight + cellPadding, {
                            width: colWidth,
                            align: 'left',
                        });
                });
            });
            pageNumber++
        }

        // Draw table headers
        // doc.font('Helvetica-Bold').fontSize(12);
        // table.headers.forEach((header, i) => {
        //     doc
        //         .rect(50 + i * columnWidth, tableTop, columnWidth, rowHeight)
        //         .stroke()
        //         .text(header, 50 + i * columnWidth + cellPadding, tableTop + cellPadding, {
        //             width: columnWidth,
        //             align: 'left',
        //         });
        // });

        // Draw table rows
        // doc.font('Helvetica').fontSize(10);
        // table.rows.forEach((row, rowIndex) => {
        //     row.forEach((cell, colIndex) => {
        //         doc
        //             .rect(50 + colIndex * columnWidth, tableTop + (rowIndex + 1) * rowHeight, columnWidth, rowHeight)
        //             .stroke()
        //             .text(cell, 50 + colIndex * columnWidth + cellPadding, tableTop + (rowIndex + 1) * rowHeight + cellPadding, {
        //                 width: columnWidth,
        //                 align: 'left',
        //             });
        //     });
        // });
        doc.end();
        writeStream.on('finish', () => {
            dialog.showMessageBox({
                type: 'info',
                title: 'Download Completo',
                message: 'A lista de músicas foi baixada com sucesso!',
                buttons: ['OK']
            });
        });
    });

}

module.exports = { generatePDF };