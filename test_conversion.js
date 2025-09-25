// 测试转换函数
const testBlock = {
  type: 'heading_1',
  heading_1: {
    rich_text: [
      {
        type: 'text',
        text: {
          content: '移动电源测试指南',
          link: null
        },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        },
        plain_text: '移动电源测试指南',
        href: null
      }
    ],
    is_toggleable: false,
    color: 'default'
  }
};

function convertRichTextToMarkdown(richText) {
  if (\!Array.isArray(richText) || richText.length === 0) {
    return '';
  }
  
  return richText.map(text => {
    let content = text.text ? text.text.content || '' : '';
    return content;
  }).join('');
}

const h1Title = convertRichTextToMarkdown(testBlock.heading_1.rich_text || []);
const result = '# ' + h1Title;

console.log('Rich text:', JSON.stringify(testBlock.heading_1.rich_text, null, 2));
console.log('Extracted title:', h1Title);
console.log('Final markdown:', result);
