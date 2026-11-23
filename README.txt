CARA DEPLOY KE VERCEL
1. Upload seluruh isi folder ini ke repo GitHub (atau `vercel --prod` dari folder ini).
   Struktur:  public/index.html  +  api/read.js
2. Vercel > Project > Settings > Environment Variables
   Tambah:  ANTHROPIC_API_KEY = (API key Anda dari console.anthropic.com)
3. Redeploy.
