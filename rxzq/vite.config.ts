import { defineConfig } from 'vite'

// base 用相对路径，保证部署到 {用户名}.github.io/{仓库名} 子路径下资源也能正确加载
export default defineConfig({
  base: './',
})
