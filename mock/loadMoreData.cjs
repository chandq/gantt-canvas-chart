// import { DateUtils } from '../src/core/dateUtils';

const currentDay = new Date();
let i = 0;
module.exports = {
  '/mock/api/gantt-data': (req, res) => {
    const params = req.query;
    console.log('params', params);
    res.json(getDemo1Data(params));
  }
};

function getDemo1Data(params) {
  function getNextDate({ date, direction, days }) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + (direction === 'left' ? -days : days));
    return newDate;
  }
  return [
    {
      id: 'proj0' + ++i,
      name: '项目总览' + ++i,
      tasks: [
        {
          id: 't000' + ++i,
          name: '项目需求背景编写',

          // planStart: '2025-10-01',
          // planEnd: '2025-10-01',
          actualStart: getNextDate({ ...params, days: 3 }),
          actualEnd: getNextDate({ ...params, days: 3 }),
          leftRemark: '刘玲',
          rightRemark: '待开始'
          // planOffsetPercent: [0.1, 0.9]
          // styleClass: 'demo1-task'
        },
        {
          id: 't0' + ++i,
          name: '整体介绍草稿' + ++i,

          planStart: getNextDate({ ...params, days: 3 }),
          planEnd: getNextDate({ ...params, days: 3 }),
          actualStart: getNextDate({ ...params, days: 3 }),
          actualEnd: getNextDate({ ...params, days: 3 }),
          leftRemark: '龙扥塞缝森我累得',
          rightRemark: '已完成',
          planOffsetPercent: [0.1, 0.9]
          // styleClass: 'demo1-task'
        }
      ]
    },
    {
      id: 'proj1' + ++i,
      name: '项目规划',
      tasks: [
        {
          id: 't1' + ++i,
          name: '需求分析',
          planStart: getNextDate({ ...params, days: 3 }),
          planEnd: getNextDate({ ...params, days: 3 }),
          actualStart: getNextDate({ ...params, days: 3 }),
          actualEnd: getNextDate({ ...params, days: 3 }),
          leftRemark: '张三',
          rightRemark: '已完成',
          styleClass: 'demo1-task'
        }
      ]
    },
    {
      id: 'proj2' + ++i,
      name: '设计阶段',
      tasks: [
        {
          id: 't2' + ++i,
          name: 'UI/UX 设计',
          planStart: getNextDate({ ...params, days: 3 }),
          planEnd: getNextDate({ ...params, days: 3 }),
          actualStart: getNextDate({ ...params, days: 3 }),
          actualEnd: getNextDate({ ...params, days: 3 }),
          dependencies: ['t1'],
          leftRemark: '李四',
          rightRemark: '进行中',
          styleClass: 'demo1-task'
        }
      ]
    },
    {
      id: 'proj3' + ++i,
      name: '开发阶段',
      tasks: [
        {
          id: 't3' + ++i,
          name: '前端开发',
          planStart: getNextDate({ ...params, days: 3 }),
          planEnd: getNextDate({ ...params, days: 3 }),
          actualStart: getNextDate({ ...params, days: 3 }),
          actualEnd: getNextDate({ ...params, days: 3 }),
          dependencies: ['t2'],
          leftRemark: '王五',
          rightRemark: '进行中',
          styleClass: 'demo1-task'
        },
        {
          id: 't5' + ++i,
          name: '后端开发',
          planStart: getNextDate({ ...params, days: 3 }),
          planEnd: getNextDate({ ...params, days: 3 }),
          actualStart: getNextDate({ ...params, days: 3 }),
          actualEnd: getNextDate({ ...params, days: 3 }),
          // dependencies: ['t4'],
          // dependencies: ['t4', `vt_${1}_1`, `vt_${1}_2`, `vt_${2}_2`],
          leftRemark: '孙七',
          rightRemark: '已完成',
          styleClass: 'demo1-task'
        }
      ]
    },
    {
      id: 'proj4' + ++i,
      name: '测试与集成',
      tasks: [
        {
          id: 't6' + ++i,
          name: '集成测试',
          planStart: getNextDate({ ...params, days: 3 }),
          planEnd: getNextDate({ ...params, days: 3 }),
          actualStart: getNextDate({ ...params, days: 3 }),
          dependencies: ['t3', 't5'],
          leftRemark: '测试组',
          rightRemark: '进行中',
          actualBgColor: '#4984ec',
          styleClass: 'demo1-task'
        }
      ]
    }
  ];
}
