function generateEmailTemplate(products) {
    return `
      <style type="text/css">
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          width: 100%;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
        }
        .header {
          background-color: #007bff;
          color: #ffffff;
          padding: 10px;
          text-align: center;
        }
        .content {
          margin: 20px 0;
        }
        .product-table {
          width: 100%;
          border-collapse: collapse;
        }
        .product-table th, .product-table td {
          border: 1px solid #ccc;
          padding: 8px;
        }
        .product-table th {
          background-color: #007bff;
          color: white;
        }
        .footer {
          margin-top: 20px;
          padding: 10px;
          background-color: #f1f1f1;
          text-align: center;
        }
      </style>
      <div class="container">
        <div class="header">
          <h1>Product Reminder</h1>
        </div>
        <div class="content">
          <p>Dear [Recipient Name],</p>
          <p>This is a reminder about the following products:</p>
          <table class="product-table">
            <thead>
              <tr>
                <th>Sr. No</th>
                <th>Product ID</th>
                <th>Title</th>
                <th>Variant Title</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${products.length && products?.map(product => `
                ${product?.Variant?.map((variant, index) => `
                  <tr key="${product?.productId}-${variant?.name}">
                    ${index === 0 ? `
                      <td rowspan="${product?.Variant.length}">${index + 1}</td>
                      <td rowspan="${product?.Variant.length}">${product?.productId}</td>
                      <td rowspan="${product?.Variant.length}">${product?.name}</td>
                    ` : ''}
                    <td>${variant?.name}</td>
                    <td>${variant?.qnt}</td>
                  </tr>
                `).join('')}
              `).join('')}
            </tbody>
          </table>
          <p>Please review and take the necessary actions.</p>
        </div>
        <div class="footer">
          <p>Thank you,</p>
          <p>Codecrew</p>
        </div>
      </div>
    `;
}

export default generateEmailTemplate