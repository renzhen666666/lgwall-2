import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import fs from 'fs';
import winston from 'winston';
import 'winston-daily-rotate-file';
import tool from './tool.mjs';
import dotenv from 'dotenv';


import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());


dotenv.config({ path: './.env' });

const pagesDataPath = path.join(__dirname, 'pages');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const routesModule = await import('./routes.mjs');
const routes = routesModule.default;


class RouteParser {
    constructor(routes) {
        // 预编译路由配置
        this.compiledRoutes = routes.map(route => this.compileRoute(route));
    }

    // 🔥 将 "/route/:q<int>" 转换为正则和提取函数
    compileRoute(routeConfig) {
        const { path: routePath, template, function: funcConfig } = routeConfig;
        // 1. 提取参数定义 (name, type)
        const paramDefs = [];
        const regexPattern = routePath.replace(
            /:(\w+)(?:<(\w+)>)*\/?/g, // 匹配 :name<type> 或 :name/
            (match, paramName, paramType = 'string') => {
                paramDefs.push({ name: paramName, type: paramType });
                // 根据类型生成不同的正则捕获组
                const typeRegex = this.getTypeRegex(paramType);
                return `(${typeRegex})`;
        }
        ).replace(/\//g, '\\/'); // 转义路径分隔符

        // 2. 创建正则表达式
        const regex = new RegExp(`^${regexPattern}$`);

        // 3. 返回编译后的路由对象
        return {
            regex,
            template,
            function: funcConfig,
            paramDefs,
            extractParams: (match) => {
                const params = {};
                for (let i = 0; i < paramDefs.length; i++) {
                const { name, type } = paramDefs[i];
                let value = match[i + 1];
                // 4. 类型转换
                params[name] = this.convertParam(value, type);
                }
                return params;
            }
        };
    }

    getTypeRegex(type) {
        switch (type) {
        case 'int':
            return '\\d+'; // 只匹配数字
        case 'float':
            return '\\d+\\.\\d+'; // 简单的浮点数匹配
        case 'string':
            return '[^\\/]+?'; // 匹配非斜杠字符
        default:
            return '[^\\/]+?'; // 匹配非斜杠字符
        }
    }

    convertParam(value, type) {
        switch (type) {
        case 'int':
            return parseInt(value, 10);
        case 'float':
            return parseFloat(value);
        case 'string':
        default:
            return value;
        }
    }

    // 🔥 主匹配函数
    match(path) {
        for (const route of this.compiledRoutes) {
            const match = path.match(route.regex);
            if (match) {
                return {
                    template: route.template,
                    function: route.function,
                    params: route.extractParams(match)
                };
            }
        }
        return null; // 未找到匹配
    }
}



const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            // 使用内置 Intl 转换为北京时间
            const date = new Date(timestamp);
            const shTime = date.toLocaleString('zh-CN', { 
                timeZone: 'Asia/Shanghai',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            return `[SH ${shTime} UTC ${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'info-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '15m',
            maxFiles: '10d',
            level: 'info'
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'wrong-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '15m',
            maxFiles: '10d',
            level: 'warning'
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '15m',
            maxFiles: '10d',
            level: 'error'
        })
    ]
});

logger.info(`---------------------------------------------------`)
logger.info(`Server started at ${new Date().toLocaleString()}`);

const router = new RouteParser(routes);
const pages = new tool.contextCache((msg) => logger.warn(msg), true);


app.all('*', (req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Static file routes
app.get('/js/:filename', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'js', req.params.filename));
});

app.get('/css/:filename', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'css', req.params.filename));
});

app.get('/img/:filename', (req, res) => {
    res.sendFile(path.join(__dirname, 'data', 'img', req.params.filename));
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'data', 'img', 'favicon.ico'));
});

app.get('/config.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'config.js'));
});

app.get('/frame.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'frame.js'));
});


// API: Get page content
app.post('/api/pages/*', (req, res) => {
    try {
        let url = req.params[0];
        if (url.startsWith('/')) url = url.substring(1);

        const matchedRoute = router.match('/' + url); 

        let requestedPath, pageParamsMap={};
        const pagesPath = path.resolve(pagesDataPath);

        if(matchedRoute) {
            url = matchedRoute.template.path.substring(1);
            Object.entries(matchedRoute.template?.params)?.forEach(([key, value]) => {
                pageParamsMap[key] = matchedRoute.params[value];
            });
        } 

        
        requestedPath = path.resolve(pagesPath, url);
        

        // Security check
        if (!requestedPath.startsWith(pagesPath)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid path',
                data: { page: '400 Bad Request' }
            });
        }

        const urlSafe = url.replace(/\//g, '_');
        const htmlFilePath = path.join(requestedPath, `${urlSafe}.html`);
        const jsonFilePath = path.join(requestedPath, `${urlSafe}.json`);

        const _htmlFile = pages.read(htmlFilePath);
        const _config = pages.read(jsonFilePath);

        if (!_htmlFile.success) {
            const _404page = pages.read(path.join(__dirname, 'pages', 'error', '404', 'error_404.html')).data;
            return res.status(404).json({
                success: false,
                error: _htmlFile.error,
                data: { page: _404page }
            });
        }

        const config = _config.success ? _config.data : {};
        const page_data = _htmlFile.data;
        let page_html;

        if (typeof page_data === 'object' && page_data.html !== undefined) {
            page_html = page_data.html;
        } else {
            page_html = page_data;
        }

        page_html = tool.renderTemplate(page_html, pageParamsMap, logger.error);

        res.json({
            success: true,
            data: { page: page_html, config: config }
        });
    } catch (e) {
        logger.error(`Error: ${e}`);
        const _500data = pages.read(path.join(__dirname, 'pages', 'error', '500', 'error_500.html')).data;
        res.status(500).json({
            success: false,
            error: '500',
            data: { page: _500data }
        });
    }
});

app.post('/api/template/*', (req, res) => {
    let template = req.params[0];
    const data = pages.read(path.join(__dirname, 'templates', template))

    if(data.success) {
        res.json({ success: true, data: data.data });
    } else {
        res.status(404).json({ success: false, error: 'Template not found' });
    }
    
});


app.use('/api', (req, res, next) => {
    /*
    // 检查是否是需要特殊处理的路径
    if (req.path.startsWith('/api/pages') || req.path === '/api/navigation') {
        // 如果是已有的 API 路径，跳过代理，继续执行后续路由
        next();
    } else {
        // 否则代理到指定域
    */
    const proxy = createProxyMiddleware({
        target: process.env.BACKEND_URL || 'http://localhost:3000', // 替换为目标域名
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            logger.info(`Proxying ${req.method} ${req.url} to ${proxyReq.path}`);
        },
        onError: (err, req, res) => {
            logger.error(`Proxy error for ${req.url}:`, err);
            res.status(500).json({
                success: false,
                error: 'Proxy error',
                data: { page: '500 Proxy Error' }
            });
        }
    });
    
    proxy(req, res, next);
    // }
});

// Request logging middleware
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
        if (res.statusCode >= 500) {
            logger.error(`${req.method} ${req.url} ${res.statusCode}`);
        } else if (res.statusCode >= 400) {
            logger.warn(`${req.method} ${req.url} ${res.statusCode}`);
        } else {
            logger.info(`${req.method} ${req.url} ${res.statusCode}`);
        }
        originalSend.call(this, data);
    };
    next();
});

// Main route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});