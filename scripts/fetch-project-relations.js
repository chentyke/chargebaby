const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';

async function notionFetch(path, init = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Notion-Version': notionVersion,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Notion API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log('🔍 查询LP-1085B01的项目关系...');
    
    // 先获取LP-1085B01的页面ID
    const queryResponse = await notionFetch(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          property: 'Model',
          title: { contains: 'LP-1085B01' }
        }
      })
    });

    if (queryResponse.results.length === 0) {
      console.log('❌ 未找到LP-1085B01');
      return;
    }

    const mainProject = queryResponse.results[0];
    const mainProjectId = mainProject.id;
    const props = mainProject.properties;
    
    console.log('📋 主项目信息:');
    console.log('ID:', mainProjectId);
    console.log('型号:', props.Model?.title?.[0]?.text?.content || '未知');
    console.log('品牌:', props.品牌?.rich_text?.[0]?.text?.content || '未知');
    console.log('标题:', props.Title?.rich_text?.[0]?.text?.content || '未知');
    console.log('显示名称:', props.DisplayName?.rich_text?.[0]?.text?.content || '未知');
    
    // 检查上级项目
    console.log('\n🔗 上级项目关系:');
    const parentRelations = props['上级 项目']?.relation || [];
    if (parentRelations.length > 0) {
      console.log(`找到 ${parentRelations.length} 个上级项目:`);
      for (const relation of parentRelations) {
        console.log(`- 上级项目ID: ${relation.id}`);
        try {
          const parentPage = await notionFetch(`/pages/${relation.id}`);
          const parentProps = parentPage.properties;
          console.log(`  型号: ${parentProps.Model?.title?.[0]?.text?.content || '未知'}`);
          console.log(`  标题: ${parentProps.Title?.rich_text?.[0]?.text?.content || '未知'}`);
        } catch (error) {
          console.log(`  获取上级项目详情失败: ${error.message}`);
        }
      }
    } else {
      console.log('无上级项目');
    }

    // 检查子级项目
    console.log('\n🔗 子级项目关系:');
    const childRelations = props['子级 项目']?.relation || [];
    if (childRelations.length > 0) {
      console.log(`找到 ${childRelations.length} 个子级项目:`);
      for (let i = 0; i < childRelations.length; i++) {
        const relation = childRelations[i];
        console.log(`\n--- 子项目 ${i + 1} ---`);
        console.log(`子项目ID: ${relation.id}`);
        try {
          const childPage = await notionFetch(`/pages/${relation.id}`);
          const childProps = childPage.properties;
          console.log(`型号: ${childProps.Model?.title?.[0]?.text?.content || '未知'}`);
          console.log(`品牌: ${childProps.品牌?.rich_text?.[0]?.text?.content || '未知'}`);
          console.log(`标题: ${childProps.Title?.rich_text?.[0]?.text?.content || '未知'}`);
          console.log(`显示名称: ${childProps.DisplayName?.rich_text?.[0]?.text?.content || '未知'}`);
          console.log(`类型: ${childProps.Type?.multi_select?.map(t => t.name).join(', ') || '未知'}`);
          console.log(`标签: ${childProps.Tags?.multi_select?.map(t => t.name).join(', ') || '无'}`);
          
          // 检查是否有视频相关字段
          if (childProps.VideoLink?.url) {
            console.log(`视频链接: ${childProps.VideoLink.url}`);
          }
          if (childProps.VideoDate?.date?.start) {
            console.log(`视频日期: ${childProps.VideoDate.date.start}`);
          }
          if (childProps.VideoAuthor?.rich_text?.[0]?.text?.content) {
            console.log(`视频作者: ${childProps.VideoAuthor.rich_text[0].text.content}`);
          }
          if (childProps.VideoCover?.files?.length > 0) {
            console.log(`视频封面: ${childProps.VideoCover.files.length}个文件`);
          }
          
          // 显示评分信息
          if (childProps.OverallRating?.formula?.number) {
            console.log(`综合评分: ${childProps.OverallRating.formula.number}`);
          }
          if (childProps.PerformanceRating?.formula?.number) {
            console.log(`性能评分: ${childProps.PerformanceRating.formula.number}`);
          }
          
        } catch (error) {
          console.log(`获取子项目详情失败: ${error.message}`);
        }
      }
    } else {
      console.log('无子级项目');
    }

    // 同时查询所有以LP-1085B01开头的项目
    console.log('\n🔍 查询所有LP-1085B01相关项目...');
    const allRelatedResponse = await notionFetch(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          property: 'Model',
          title: { starts_with: 'LP-1085B01' }
        }
      })
    });

    console.log(`\n📦 找到 ${allRelatedResponse.results.length} 个LP-1085B01相关项目:`);
    allRelatedResponse.results.forEach((page, index) => {
      const props = page.properties;
      console.log(`\n${index + 1}. ${props.Model?.title?.[0]?.text?.content || '未知'}`);
      console.log(`   ID: ${page.id}`);
      console.log(`   标题: ${props.Title?.rich_text?.[0]?.text?.content || '未知'}`);
      console.log(`   显示名称: ${props.DisplayName?.rich_text?.[0]?.text?.content || '未知'}`);
      console.log(`   类型: ${props.Type?.multi_select?.map(t => t.name).join(', ') || '未知'}`);
      console.log(`   标签: ${props.Tags?.multi_select?.map(t => t.name).join(', ') || '无'}`);
      
      // 检查关系
      const parentRels = props['上级 项目']?.relation?.length || 0;
      const childRels = props['子级 项目']?.relation?.length || 0;
      console.log(`   上级项目: ${parentRels}个, 子级项目: ${childRels}个`);
    });

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();