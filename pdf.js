function generateQuotation() {
    const custPhone = document.getElementById('customer-phone').value.trim();
    if(!custPhone) {
        alert("Please enter a Customer Phone Number");
        return;
    }
    
    const customer = customerDataMap[custPhone];
    if(!customer) {
        alert(`Customer Phone "${custPhone}" not found in database!`);
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const paymentMethod = document.getElementById('payment-method').value;
    const transportMode = document.getElementById('transport-mode').value;
    const dateStr = new Date().toLocaleDateString('en-GB');

    let transportTerm = transportMode === 'exw' ? "Transportation costs extra." : "Free transportation of material to your site.";
    let paymentTerm = paymentMethod === 'advance' ? "Advance NEFT; before delivery." : "Credit; Within seven (7) days of material delivery.";

    // Background & Watermark
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFillColor(255, 245, 245);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    if (typeof WATERMARK_BASE64 !== 'undefined' && WATERMARK_BASE64.length > 100) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({opacity: 0.10})); 
        const wmWidth = 200; 
        const wmHeight = 200;
        const wmX = (pageWidth - wmWidth) / 2;
        const wmY = (pageHeight - wmHeight) / 2;
        doc.addImage(WATERMARK_BASE64, 'PNG', wmX, wmY, wmWidth, wmHeight);
        doc.restoreGraphicsState();
    }

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("BELGAUM TYRES", 14, 20);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("(Unit 1 of Belgaum Tyres & Treads Pvt Ltd.)", 14, 25);
    doc.text("Plot No. 469/18, Mukt Sainik Society,", 14, 30);
    doc.text("Opp. Market Yard, Old Bangalore- Pune Road,", 14, 35);
    doc.text("Kolhapur, Maharashtra-416 005.", 14, 40);

    // Logo
    const margin = 14; 
    const logoHeight = 26; 
    const logoWidth = 26;  
    const logoX = pageWidth - margin - logoWidth; 
    
    if (typeof LOGO_BASE64 !== 'undefined' && LOGO_BASE64.length > 100) {
            doc.addImage(LOGO_BASE64, 'PNG', logoX, 15, logoWidth, logoHeight);
    } else {
        doc.setFontSize(12);
        doc.setTextColor(200, 0, 0);
        doc.text("[LOGO]", logoX, 25);
        doc.setTextColor(0, 0, 0);
    }

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", 105, 55, null, null, "center");

   // --- TO SECTION (Updated) ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("To,", 14, 65);
    
    // Logic: Use Organization Name if present, otherwise use Person's Name
    const toName = customer.orgName ? customer.orgName : customer.name;
    doc.text(toName, 14, 70); 
    
    doc.setFont("helvetica", "normal");
    // Address Line
    doc.text(`${customer.taluk}, ${customer.district}, ${customer.state} - ${customer.pincode}`, 14, 75);
    
    // Kind Attention Logic
    let prefix = "";
    const g = customer.gender ? customer.gender.toLowerCase() : "";
    if (g.startsWith("m") && !g.startsWith("ms")) prefix = "Mr.";
    else if (g.startsWith("f") || g.startsWith("ms")) prefix = "Ms.";
    
    const formattedPhone = "+91 " + custPhone.substring(0, 5) + " " + custPhone.substring(5);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Kind Attention: ${prefix} ${customer.name} (${formattedPhone})`, 14, 82);
    
    // RESET to Normal for the Date and Body
    doc.setFont("helvetica", "normal");

    // Intro
    doc.setFont("helvetica", "normal");
    doc.text("We are pleased to provide our quotation for new tyre services.", 14, 90);
    doc.text("Kindly refer to the table below.", 14, 95);

    // Table
    let tableBody = [];
    let grandTotal = 0;

    for (let i = 1; i <= rowCount; i++) {
        const desc = document.getElementById(`search-${i}`).value;
        const basePrice = parseFloat(document.getElementById(`base-price-${i}`).value) || 0;
        const markup = parseFloat(document.getElementById(`markup-${i}`).value) || 0;
        const qty = parseFloat(document.getElementById(`qty-${i}`).value) || 1;

        if (desc && basePrice > 0) {
            const finalCMP = basePrice + markup; 
            const basicRate = finalCMP / 1.18; 
            const amount = basicRate * qty;
            const gst = amount * 0.18;
            const total = amount + gst; 

            grandTotal += total;

            tableBody.push([
                desc,
                basicRate.toFixed(2),
                qty,
                amount.toFixed(2),
                gst.toFixed(2),
                total.toFixed(2)
            ]);
        }
    }

    doc.autoTable({
        startY: 100, // Adjusted startY for new spacing
        head: [['ITEM', 'BASIC', 'QTY', 'AMOUNT', 'GST', 'TOTAL']],
        body: tableBody,
        theme: 'grid',
        headStyles: { 
            fillColor: [255, 250, 250], 
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fillColor: [255, 250, 250], 
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        styles: { fontSize: 9, halign: 'center' },
        columnStyles: { 0: { halign: 'left', cellWidth: 70 } }, 
        foot: [['', '', '', '', 'Grand Total:', Math.round(grandTotal).toFixed(2)]],
        footStyles: {
            fillColor: [255, 209, 209], 
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center'
        }
    });
    
    // Footer
    let finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Note:", 14, finalY);
    finalY += 5;
    doc.text("1. The above products are perfectly suited to your utility, based on our understanding of your need.", 14, finalY);
    finalY += 5;
    doc.text("2. All the above products are under full manufacturer's warranty.", 14, finalY);
    finalY += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", 14, finalY);
    doc.setFont("helvetica", "normal");
    finalY += 5;
    
    const terms = [
        "1. The above rates are indicative of all tax breakup.",
        "2. Quotation valid for 7 days from the date of receipt.",
        `3. Payment Terms: ${paymentTerm}`,
        `4. ${transportTerm}`
    ];

    terms.forEach(term => {
        doc.text(term, 14, finalY);
        finalY += 5;
    });

    // --- BANK DETAILS SECTION (Updated) ---
    finalY += 5;
    
    // Header Line (Bold)
    doc.setFont("helvetica", "bold");
    doc.text("Our account details for your reference:", 14, finalY);
    finalY += 5;

    // Bank Details (Unbolded / Normal)
    doc.setFont("helvetica", "normal");
    doc.text("Account Name: Belgaum Tyres.", 14, finalY);
    finalY += 5;
    doc.text("Bank: Axis Bank, Tarabai Park Branch.", 14, finalY);
    finalY += 5;
    doc.text("A/c No.: 920020016291615", 14, finalY);
    finalY += 5;
    doc.text("IFSC: UTIB 000 4388", 14, finalY);

    doc.setFont("helvetica", "bold"); 
    finalY += 10;
    doc.text("Regards,", 14, finalY);
    finalY += 5;
    doc.text("Belgaum Tyres,", 14, finalY);
    finalY += 5;
    doc.text("+91 70266 15005", 14, finalY);

    window.open(doc.output('bloburl'), '_blank');
}
