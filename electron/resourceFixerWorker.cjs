const { TMDBApi } = require('./tmdbApi.cjs');
const { Resource, Op } = require('./database.cjs');
const { AiService } = require('./aiservice.cjs');
const logger = require('./logger.cjs');
const WorkerFramework = require('./worker.cjs');

class ResourceFixerWorker extends WorkerFramework {

    constructor() {
        super();
        this.tmdbApi = new TMDBApi();
        this.aiService = new AiService();
    }

    async start() {
        super.start();
        
        if (!this.isRunning) {
            throw new Error('Worker is not running');
        }

        while (this.isRunning) {
            try {
                await this.executeTask({});
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                this.handleError('start', error);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async stop() {
        super.stop();
        logger.info('削刮进程已停止');
    }

    async executeTask({id}) {

        let query = {
            where: {
                failed_count: { [Op.lt]: 3 },  // 限制最大重试次数为3
                tmdb_id: { [Op.or]: [null, ''] },
            },
            order: [
                ['id', 'DESC']
            ]
        }

        if (id !== null && id !== '' && id != undefined) {
            query.where = {id: id};
        }

        const resource = await Resource.findOne(query);

        if (!resource) {
            logger.info('没有找到需要处理的资源');
            return
        }

        if (!resource || !resource.title) {
            this.sendMessage('error', { success: false, error: error.message });
            return;
        }

        if (!resource.title) {
            await this.updateFailedCount(resource, error);
            this.sendMessage('error', { success: false, error: error.message, resourceId: resource.id });
            return;
        }

        // 清理标题
        let cleanedTitles = await this.aiService.call(`
            你是一个专业的电影名称清理助手，请按照以下规则处理电影标题：

            规则：
            1. 识别并保留真实电影名称，去除所有额外信息
            2. 如果有多语言标题，优先保留原始语言标题
            3. 如果解析之后的名称有冒号，则保留冒号后面的内容，冒号和冒号前面的内容不要
            4. 去除以下内容：
                - 发布组信息（如[阳光电影www.ygdy8.com]、迅雷下载、第一电影天堂等）
                - 分辨率信息（如1080P、4K、HD）
                - 字幕信息（如国语中字、双语）
                - 年份信息（如2023、2024）
                - 格式信息（如.mp4、BluRay）
                - 其他额外标签（如完整版、导演剪辑版）
                - 院线和发行信息（如HD国语中英双字）
                - 网站和下载信息（如迅雷下载、阳光电影）
                - 剧集信息 (如 第一季 第二季)
                - 标点符号
            5. 仅输出可能的电影名称 JSON 数组，不要输出任何其它信息,不要输出  \`
            示例：
            输入："[电影天堂www.dytt89.com].泰坦尼克号.1997.国英双语.中英字幕.BluRay.1080P.x264.mp4"
            输出：["泰坦尼克号"]

            输入："《肖申克的救赎》The.Shawshank.Redemption.1994.双语字幕.1080P"
            输出：["肖申克的救赎"]

            输入："2024年剧情《小小的我》HD国语中英双字迅雷下载_阳光电影_第一电影天堂 小小的我.2024.HD.1080P.国语中英双字"
            输出：["小小的我"]

            输入："《枯草/春风劲草》"
            输出: ["枯草","春风劲草"]

            输入："火线警探：原始城市"
            输出: ["原始城市"]
            
            请处理以下电影标题：
            ${resource.title}`
        );

        cleanedTitles = JSON.parse(cleanedTitles);
        logger.info(`标题清理完成: ${cleanedTitles}(${resource.title})`);
        
        // 使用清理后的标题搜索TMDB电影信息
        let searchResults;
        for (const cleanedTitle of cleanedTitles) {
            logger.info(`正在搜索电影信息: ${cleanedTitle}`);
            searchResults = await this.tmdbApi.searchMovies(cleanedTitle);
            if (searchResults && searchResults.length > 0) {
                break;
            }
        }
        if (!searchResults || searchResults.length === 0) {
            await this.updateFailedCount(resource, new Error(`未找到匹配的电影信息`));
            return;
        }

        const movieInfo = searchResults[0];
        logger.info(`电影信息获取成功 movieInfo: ${JSON.stringify(movieInfo, null, 2)}`);

        // 使用第一个搜索结果作为最匹配的电影
        if (!movieInfo) {
            logger.info('未匹配电影信息');
            await this.updateFailedCount(resource, new Error('未匹配电影信息'));
            return;
        }

        await Resource.update({
            title: movieInfo.title,
            original_title: movieInfo.originalTitle,
            overview: movieInfo.overview,
            poster_path: movieInfo.posterPath,
            backdrop_path: movieInfo.backdropPath,
            release_date: movieInfo.releaseDate,
            vote_average: movieInfo.voteAverage,
            vote_count: movieInfo.voteCount,
            popularity: movieInfo.popularity,
            genres: JSON.stringify(movieInfo.genres),
            runtime: movieInfo.runtime,
            status: movieInfo.status,
            tmdb_id: movieInfo.id,
            cast: JSON.stringify(movieInfo.cast)
        }, {
            where: { id: resource.id }
        });
    
        logger.info(`资源更新成功：${resource.title} -> ${movieInfo.title} (TMDB ID: ${movieInfo.id})`);
        this.sendMessage('task_result', { success: true, message: `削刮成功: ${resource.title} -> ${movieInfo.title} (TMDB ID: ${movieInfo.id})`, resourceId: resource.id });
    }
    
    async updateFailedCount(resource, error) {
        logger.error(`处理失败: ${error.message}`);
        await Resource.update({
            failed_count: (resource.failed_count || 0) + 1,
        }, {
            where: { id: resource.id }
        });
        this.sendMessage('task_result', { success: false, error: error.message, resourceId: resource.id });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// 创建worker实例
const worker = new ResourceFixerWorker();
