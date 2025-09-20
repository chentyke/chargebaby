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
    console.log('🔍 获取数据库结构...');
    
    // 获取数据库结构
    const database = await notionFetch(`/databases/${databaseId}`);
    
    console.log('\n📊 数据库信息:');
    console.log('名称:', database.title[0]?.text?.content || '未知');
    console.log('ID:', database.id);
    
    console.log('\n📋 数据库字段结构:');
    Object.entries(database.properties).forEach(([key, prop]) => {
      console.log(`- ${key}: ${prop.type}${prop.type === 'select' ? ` (选项: ${prop.select?.options?.map(o => o.name).join(', ')})` : ''}`);
    });

    // 获取前几条数据看结构
    console.log('\n🔍 查询LP-1085B01相关数据...');
    const queryResponse = await notionFetch(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          property: 'Model',
          title: { contains: 'LP-1085B01' }
        }
      })
    });

    console.log(`\n📦 找到 ${queryResponse.results.length} 条LP-1085B01相关记录:`);
    
    queryResponse.results.forEach((page, index) => {
      console.log(`\n--- 记录 ${index + 1} ---`);
      console.log('页面ID:', page.id);
      
      // 显示主要字段
      const props = page.properties;
      console.log('品牌:', props.Brand?.title?.[0]?.text?.content || props.品牌?.title?.[0]?.text?.content || '未知');
      console.log('型号:', props.Model?.title?.[0]?.text?.content || '未知');
      console.log('标题:', props.Title?.title?.[0]?.text?.content || '未知');
      console.log('类型:', props.Type?.multi_select?.map(t => t.name).join(', ') || '未知');
      
      // 显示所有字段名
      console.log('\n所有字段:');
      Object.keys(props).forEach(key => {
        const value = props[key];
        let displayValue = '';
        
        switch(value.type) {
          case 'title':
          case 'rich_text':
            displayValue = value[value.type]?.[0]?.text?.content || '';
            break;
          case 'number':
            displayValue = value.number || 0;
            break;
          case 'select':
            displayValue = value.select?.name || '';
            break;
          case 'multi_select':
            displayValue = value.multi_select?.map(s => s.name).join(', ') || '';
            break;
          case 'date':
            displayValue = value.date?.start || '';
            break;
          case 'files':
            displayValue = value.files?.length > 0 ? `${value.files.length}个文件` : '';
            break;
          default:
            displayValue = '...';
        }
        
        if (displayValue) {
          console.log(`  ${key}: ${displayValue}`);
        }
      });
    });

    // 如果没找到，再查询所有数据看看有什么
    if (queryResponse.results.length === 0) {
      console.log('\n🔍 未找到LP-1085B01，获取前5条数据查看...');
      const allDataResponse = await notionFetch(`/databases/${databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify({
          page_size: 5
        })
      });

      console.log(`\n📦 数据库中共有数据，显示前5条:`);
      allDataResponse.results.forEach((page, index) => {
        const props = page.properties;
        console.log(`\n${index + 1}. 型号: ${props.Model?.title?.[0]?.text?.content || '未知'}`);
        console.log(`   品牌: ${props.Brand?.title?.[0]?.text?.content || props.品牌?.rich_text?.[0]?.text?.content || '未知'}`);
        console.log(`   类型: ${props.Type?.multi_select?.map(t => t.name).join(', ') || '未知'}`);
      });
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();