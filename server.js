const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// إعداد البروكسي لجلب تميم برو والتعديل عليه لحظياً
app.use('/', createProxyMiddleware({
  target: 'https://tamimpro.com',
  changeOrigin: true,
  selfHandleResponse: true, // يتيح تعديل كود الـ HTML قبل إرساله للمتصفح
  on: {
    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      // إذا كان الملف عبارة عن صفحة HTML
      const contentType = proxyRes.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        let html = responseBuffer.toString('utf8');

        // 1. حقن كود CSS قوي داخل الصفحة لإخفاء وحذف سطر النسخة التجريبية تماماً حتى أثناء الطباعة
        const cleanStyle = `
          <style>
            /* إخفاء سطر التجربة والترخيص في الشاشة والطباعة */
            footer, 
            [class*="trial"], 
            [class*="license"], 
            .watermark,
            div:has(> a[href*="license"]),
            div:has(> span:contains("نسخة تجريبية")) {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
            }
            @media print {
              footer, [class*="trial"], .watermark {
                display: none !important;
              }
              @page {
                margin-bottom: 0mm !important;
              }
            }
          </style>
        `;

        // 2. استبدال وحذف النصوص الصريحة من الـ HTML
        html = html.replace(/نسخة تجريبية مجانية/g, '');
        html = html.replace(/TamimPro\.com/gi, '');
        html = html.replace(/يمكنك إزالة هذا الرابط: من الإعدادات ← الترخيص/g, '');

        // حقن الستايل المنظف قبل قفل وسم </head>
        return html.replace('</head>', cleanStyle + '</head>');
      }

      // الملفات الأخرى (صور، جافاسكريبت، خطوط) تمر كما هي بدون تعديل
      return responseBuffer;
    })
  }
}));

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`منصة مدارس واحد جدة تعمل الآن على: http://localhost:${PORT}`);
  console.log(`====================================================`);
});