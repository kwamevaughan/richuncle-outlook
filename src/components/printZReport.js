// Print a Z-Report in a new window with print-friendly HTML
export default function printZReport(zReport) {
  if (!zReport) return;
  const session = zReport.session || {};
  const paymentBreakdown = zReport.paymentBreakdown || {};
  const productsSold = zReport.productsSold || [];
  
  // Get register name from session data or fallback to register_id
  const registerName = session.register_name || session.register?.name || session.register_id || 'Unknown Register';
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Z-Report</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: 'Courier New', monospace; }
          .zreport { width: 90mm; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
          .info { font-size: 12px; margin-bottom: 5px; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .table th, .table td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 12px; }
          .table th { background: #f0f0f0; }
          .footer { text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          .timestamp { font-size: 10px; }
          @page { margin: 10mm; }
        }
        body { font-family: 'Courier New', monospace; }
        .zreport { width: 90mm; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
        .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
        .info { font-size: 12px; margin-bottom: 5px; }
        .section { margin-bottom: 15px; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .table th, .table td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 12px; }
        .table th { background: #f0f0f0; }
        .footer { text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
        .timestamp { font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="zreport">
        <div class="header">
          <div class="title">Z-Report</div>
          <div class="info">Register: ${registerName}</div>
        </div>
        <div class="section">
          <div class="section-title">Session Period</div>
          <div class="row"><span>${session.opened_at ? new Date(session.opened_at).toLocaleString() : '-'}</span><span>to</span><span>${session.closed_at ? new Date(session.closed_at).toLocaleString() : '-'}</span></div>
          <div class="row"><span>Operator</span><span>${session.user || session.user_id || '-'}</span></div>
          <div class="row"><span>Over/Short</span><span>GHS ${session.over_short !== undefined ? Number(session.over_short).toFixed(2) : '-'}</span></div>
          <div class="row"><span>Opening Cash</span><span>GHS ${session.opening_cash !== undefined ? Number(session.opening_cash).toFixed(2) : '-'}</span></div>
          <div class="row"><span>Closing Cash</span><span>GHS ${session.closing_cash !== undefined ? Number(session.closing_cash).toFixed(2) : '-'}</span></div>
          <div class="row"><span>Total Sales</span><span>GHS ${zReport.totalSales !== undefined ? Number(zReport.totalSales).toFixed(2) : '-'}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Payment Breakdown</div>
          <table class="table">
            <thead><tr><th>Type</th><th>Amount</th></tr></thead>
            <tbody>
              ${Object.entries(paymentBreakdown).map(([type, amount]) => `<tr><td>${type.replace('_', ' ')} Payment</td><td>GHS ${Number(amount).toFixed(2)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="section">
          <div class="section-title">Products Sold</div>
          <table class="table">
            <thead><tr><th>Product</th><th>Quantity</th><th>Total</th></tr></thead>
            <tbody>
              ${productsSold.length > 0 ? productsSold.map(prod => `<tr><td>${prod.name}</td><td>${prod.quantity}</td><td>GHS ${Number(prod.total).toFixed(2)}</td></tr>`).join('') : `<tr><td colspan="3" style="text-align:center;color:#888;">No products sold</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="footer">
          <div class="timestamp">Printed: ${new Date().toLocaleString('en-GH')}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const printWindow = window.open('', 'PrintWindow', 'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }
      }, 1500);
    }
    return true;
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
}

// For preview: return the HTML string only
printZReport.__previewHtml = function(zReport) {
  if (!zReport) return '';
  const session = zReport.session || {};
  const paymentBreakdown = zReport.paymentBreakdown || {};
  const productsSold = zReport.productsSold || [];
  
  // Get register name from session data or fallback to register_id
  const registerName = session.register_name || session.register?.name || session.register_id || 'Unknown Register';
  return `
    <div class="zreport">
      <div class="header">
        <div class="title">Z-Report</div>
        <div class="info">Register: ${registerName}</div>
      </div>
      <div class="section">
        <div class="section-title">Session Period</div>
        <div class="row"><span>${session.opened_at ? new Date(session.opened_at).toLocaleString() : '-'}</span><span>to</span><span>${session.closed_at ? new Date(session.closed_at).toLocaleString() : '-'}</span></div>
        <div class="row"><span>Cashier</span><span>${session.user || session.user_id || '-'}</span></div>
        <div class="row"><span>Over/Short</span><span>GHS ${session.over_short !== undefined ? Number(session.over_short).toFixed(2) : '-'}</span></div>
        <div class="row"><span>Opening Cash</span><span>GHS ${session.opening_cash !== undefined ? Number(session.opening_cash).toFixed(2) : '-'}</span></div>
        <div class="row"><span>Closing Cash</span><span>GHS ${session.closing_cash !== undefined ? Number(session.closing_cash).toFixed(2) : '-'}</span></div>
        <div class="row"><span>Total Sales</span><span>GHS ${zReport.totalSales !== undefined ? Number(zReport.totalSales).toFixed(2) : '-'}</span></div>
      </div>
      <div class="section">
        <div class="section-title">Payment Breakdown</div>
        <table class="table">
          <thead><tr><th>Type</th><th>Amount</th></tr></thead>
          <tbody>
            ${Object.entries(paymentBreakdown).map(([type, amount]) => `<tr><td>${type.replace('_', ' ')} Payment</td><td>GHS ${Number(amount).toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Products Sold</div>
        <table class="table">
          <thead><tr><th>Product</th><th>Quantity</th><th>Total</th></tr></thead>
          <tbody>
            ${productsSold.length > 0 ? productsSold.map(prod => `<tr><td>${prod.name}</td><td>${prod.quantity}</td><td>GHS ${Number(prod.total).toFixed(2)}</td></tr>`).join('') : `<tr><td colspan="3" style="text-align:center;color:#888;">No products sold</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="footer">
        <div class="timestamp">Printed: ${new Date().toLocaleString('en-GH')}</div>
      </div>
    </div>
    <style>
      .zreport { width: 90mm; margin: 0 auto; padding: 20px; font-family: 'Courier New', monospace; }
      .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
      .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
      .info { font-size: 12px; margin-bottom: 5px; }
      .section { margin-bottom: 15px; }
      .section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
      .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
      .table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
      .table th, .table td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 12px; }
      .table th { background: #f0f0f0; }
      .footer { text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
      .timestamp { font-size: 10px; }
    </style>
  `;
}; 