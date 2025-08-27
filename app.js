// 配置Tailwind自定义颜色
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6',
                secondary: '#10b981',
                accent: '#f59e0b',
                danger: '#ef4444',
                dark: '#1e293b',
                light: '#f8fafc'
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        }
    }
};

// 数据模型 - 负责数据管理和业务逻辑
const appData = {
    currentMonth: new Date(),
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    data: {}, // 结构: { "YYYY-MM": { income: number, disposable: number, budgetItems: [], expenses: [] } }
    
    // 初始化数据
    init() {
        const savedData = localStorage.getItem('salaryBudgetData');
        if (savedData) {
            this.data = JSON.parse(savedData);
        }
        
        // 确保当前月份有数据
        const currentKey = this.getCurrentMonthKey();
        if (!this.data[currentKey]) {
            this.data[currentKey] = {
                income: 0,
                disposable: 0,
                budgetItems: [],
                expenses: []
            };
        }
    },
    
    // 获取当前月份的键 (YYYY-MM)
    getCurrentMonthKey() {
        const year = this.currentMonth.getFullYear();
        const month = String(this.currentMonth.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    },
    
    // 获取当前月份的数据
    getCurrentMonthData() {
        const key = this.getCurrentMonthKey();
        if (!this.data[key]) {
            this.data[key] = {
                income: 0,
                disposable: 0,
                budgetItems: [],
                expenses: []
            };
        }
        return this.data[key];
    },
    
    // 保存数据到本地存储
    saveData() {
        localStorage.setItem('salaryBudgetData', JSON.stringify(this.data));
    },
    
    // 更新月收入
    updateIncome(amount) {
        const data = this.getCurrentMonthData();
        data.income = parseFloat(amount);
        this.saveData();
        return data.income;
    },
    
    // 更新可支配金额
    updateDisposable(amount) {
        const data = this.getCurrentMonthData();
        data.disposable = parseFloat(amount);
        this.saveData();
        return data.disposable;
    },
    
    // 添加预算项目
    addBudgetItem(name, amount) {
        const data = this.getCurrentMonthData();
        const newItem = {
            id: Date.now().toString(),
            name,
            amount: parseFloat(amount),
            used: 0
        };
        data.budgetItems.push(newItem);
        this.saveData();
        return newItem;
    },
    
    // 更新预算项目
    updateBudgetItem(id, name, amount) {
        const data = this.getCurrentMonthData();
        const item = data.budgetItems.find(item => item.id === id);
        if (item) {
            item.name = name;
            item.amount = parseFloat(amount);
            this.saveData();
            return item;
        }
        return null;
    },
    
    // 删除预算项目
    deleteBudgetItem(id) {
        const data = this.getCurrentMonthData();
        data.budgetItems = data.budgetItems.filter(item => item.id !== id);
        // 同时删除关联的支出记录
        data.expenses = data.expenses.filter(expense => expense.budgetId !== id);
        this.saveData();
    },
    
    // 添加支出记录
    addExpense(date, budgetId, amount, note) {
        const data = this.getCurrentMonthData();
        const newExpense = {
            id: Date.now().toString(),
            date,
            budgetId,
            amount: parseFloat(amount),
            note
        };
        data.expenses.push(newExpense);
        
        // 更新预算项目的已使用金额
        const budgetItem = data.budgetItems.find(item => item.id === budgetId);
        if (budgetItem) {
            budgetItem.used += parseFloat(amount);
        }
        
        this.saveData();
        return newExpense;
    },
    
    // 更新支出记录
    updateExpense(id, date, budgetId, amount, note) {
        const data = this.getCurrentMonthData();
        const expense = data.expenses.find(exp => exp.id === id);
        if (expense) {
            // 先减去旧金额
            const oldBudgetId = expense.budgetId;
            const oldAmount = expense.amount;
            
            const oldBudgetItem = data.budgetItems.find(item => item.id === oldBudgetId);
            if (oldBudgetItem) {
                oldBudgetItem.used -= oldAmount;
            }
            
            // 更新支出信息
            expense.date = date;
            expense.budgetId = budgetId;
            expense.amount = parseFloat(amount);
            expense.note = note;
            
            // 加上新金额
            const newBudgetItem = data.budgetItems.find(item => item.id === budgetId);
            if (newBudgetItem) {
                newBudgetItem.used += parseFloat(amount);
            }
            
            this.saveData();
            return expense;
        }
        return null;
    },
    
    // 删除支出记录
    deleteExpense(id) {
        const data = this.getCurrentMonthData();
        const expense = data.expenses.find(exp => exp.id === id);
        if (expense) {
            // 减去已使用金额
            const budgetItem = data.budgetItems.find(item => item.id === expense.budgetId);
            if (budgetItem) {
                budgetItem.used -= expense.amount;
            }
            
            // 删除支出记录
            data.expenses = data.expenses.filter(exp => exp.id !== id);
            this.saveData();
        }
    },
    
    // 计算总预算
    getTotalBudget() {
        const data = this.getCurrentMonthData();
        return data.budgetItems.reduce((total, item) => total + item.amount, 0);
    },
    
    // 计算总支出
    getTotalSpent() {
        const data = this.getCurrentMonthData();
        return data.budgetItems.reduce((total, item) => total + item.used, 0);
    },
    
    // 计算剩余预算 (可支配金额 - 总预算)
    getRemainingBudget() {
        const data = this.getCurrentMonthData();
        return data.disposable - this.getTotalBudget();
    },
    
    // 计算剩余金额 (月收入 - 可支配金额)
    getRemainingAmount() {
        const data = this.getCurrentMonthData();
        return data.income - data.disposable;
    },
    
    // 切换到上一个月
    prevMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.saveData();
    },
    
    // 切换到下一个月
    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.saveData();
    },
    
    // 获取财务健康度得分 (0-100)
    getHealthScore() {
        const data = this.getCurrentMonthData();
        if (data.income === 0) return 0;
        
        // 健康度基于剩余金额占收入的比例
        const remainingRatio = this.getRemainingAmount() / data.income;
        let score = remainingRatio * 100;
        return Math.max(0, Math.min(100, Math.round(score)));
    }
};

// UI控制器 - 负责界面渲染和用户交互
const uiController = {
    // 初始化UI
    init() {
        this.initMonthSelect();
        this.updateMonthDisplay();
        this.renderAll();
        this.bindEvents();
        // 处理窗口大小变化时重绘图表
        window.addEventListener('resize', () => {
            this.renderCharts();
        });
    },
    
    // 初始化月份选择器
    initMonthSelect() {
        const select = document.getElementById('monthSelect');
        select.innerHTML = '';
        
        // 生成未来12个月和过去12个月的选项
        const now = new Date();
        for (let i = -12; i <= 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${year}年${month}月`;
            select.appendChild(option);
        }
        
        // 设置当前月份为选中状态
        select.value = appData.getCurrentMonthKey();
    },
    
    // 更新月份显示
    updateMonthDisplay() {
        const year = appData.currentMonth.getFullYear();
        const month = appData.currentMonth.getMonth() + 1;
        document.getElementById('currentMonthDisplay').textContent = `${year}年${month}月`;
        document.getElementById('monthSelect').value = appData.getCurrentMonthKey();
    },
    
    // 渲染所有UI元素
    renderAll() {
        this.renderIncome();
        this.renderDisposable();
        this.renderBudgetItems();
        this.renderExpenses();
        this.renderSummary();
        this.renderCharts();
        this.updateExpenseItemSelect();
    },
    
    // 渲染月收入
    renderIncome() {
        const data = appData.getCurrentMonthData();
        document.getElementById('monthlyIncome').textContent = `¥${data.income.toFixed(2)}`;
        document.getElementById('incomeAmount').value = data.income || '';
    },
    
    // 渲染可支配金额
    renderDisposable() {
        const data = appData.getCurrentMonthData();
        document.getElementById('disposableAmount').textContent = `¥${data.disposable.toFixed(2)}`;
        document.getElementById('disposableAmountInput').value = data.disposable || '';
    },
    
    // 渲染预算项目表格
    renderBudgetItems() {
        const data = appData.getCurrentMonthData();
        const tableBody = document.getElementById('budgetItemsTable');
        
        if (data.budgetItems.length === 0) {
            tableBody.innerHTML = `
                <tr class="text-center text-gray-500">
                    <td colspan="5" class="py-6">请添加预算项目</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = '';
        data.budgetItems.forEach(item => {
            const remaining = item.amount - item.used;
            const usagePercentage = item.amount > 0 ? (item.used / item.amount) * 100 : 0;
            
            // 确定进度条颜色
            let progressColor = 'bg-secondary'; // 绿色
            if (usagePercentage > 80) progressColor = 'bg-accent'; // 黄色
            if (usagePercentage > 100) progressColor = 'bg-danger'; // 红色
            
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-100 hover:bg-gray-50 transition-colors';
            row.innerHTML = `
                <td class="py-2 px-3">${item.name}</td>
                <td class="py-2 px-3">¥${item.amount.toFixed(2)}</td>
                <td class="py-2 px-3">¥${item.used.toFixed(2)}</td>
                <td class="py-2 px-3">
                    <div class="flex flex-col">
                        <span>¥${remaining.toFixed(2)}</span>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div class="${progressColor} h-2 rounded-full" style="width: ${Math.min(100, usagePercentage)}%"></div>
                        </div>
                    </div>
                </td>
                <td class="py-2 px-3">
                    <div class="flex space-x-2">
                        <button class="edit-budget-item text-primary hover:text-primary/80" data-id="${item.id}">
                            <i class="fa fa-pencil"></i>
                        </button>
                        <button class="delete-budget-item text-danger hover:text-danger/80" data-id="${item.id}">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    },
    
    // 渲染支出记录表格
    renderExpenses() {
        const data = appData.getCurrentMonthData();
        const tableBody = document.getElementById('expensesTable');
        
        // 按日期降序排序
        const sortedExpenses = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedExpenses.length === 0) {
            tableBody.innerHTML = `
                <tr class="text-center text-gray-500">
                    <td colspan="5" class="py-6">暂无支出记录</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = '';
        sortedExpenses.forEach(expense => {
            // 查找对应的预算项目名称
            const budgetItem = data.budgetItems.find(item => item.id === expense.budgetId);
            const itemName = budgetItem ? budgetItem.name : '未知项目';
            
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-100 hover:bg-gray-50 transition-colors';
            row.innerHTML = `
                <td class="py-2 px-3">${this.formatDate(expense.date)}</td>
                <td class="py-2 px-3">${itemName}</td>
                <td class="py-2 px-3">¥${expense.amount.toFixed(2)}</td>
                <td class="py-2 px-3">${expense.note || '-'}</td>
                <td class="py-2 px-3">
                    <div class="flex space-x-2">
                        <button class="edit-expense text-primary hover:text-primary/80" data-id="${expense.id}">
                            <i class="fa fa-pencil"></i>
                        </button>
                        <button class="delete-expense text-danger hover:text-danger/80" data-id="${expense.id}">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    },
    
    // 渲染摘要信息
    renderSummary() {
        document.getElementById('totalBudget').textContent = `¥${appData.getTotalBudget().toFixed(2)}`;
        document.getElementById('remainingBudget').textContent = `¥${appData.getRemainingBudget().toFixed(2)}`;
        document.getElementById('remainingAmount').textContent = `¥${appData.getRemainingAmount().toFixed(2)}`;
        
        // 更新健康度信息
        const healthScore = appData.getHealthScore();
        document.getElementById('healthScore').textContent = `${healthScore}%`;
        
        // 设置健康度描述
        let healthDesc = '';
        if (healthScore === 0) {
            healthDesc = '请输入月收入和预算数据以获取分析';
        } else if (healthScore < 30) {
            healthDesc = '财务状况不佳，可储蓄金额较少';
        } else if (healthScore < 60) {
            healthDesc = '财务状况一般，建议适当增加储蓄';
        } else if (healthScore < 80) {
            healthDesc = '财务状况良好，储蓄比例合理';
        } else {
            healthDesc = '财务状况优秀，储蓄比例较高';
        }
        document.getElementById('healthDescription').textContent = healthDesc;
    },
    
    // 渲染图表 - 优化移动设备显示
    renderCharts() {
        this.renderBudgetChart();
        this.renderTrendChart();
        this.renderHealthChart();
    },
    
    // 渲染预算分配图表
    renderBudgetChart() {
        const data = appData.getCurrentMonthData();
        const ctx = document.getElementById('budgetChart').getContext('2d');
        
        // 准备图表数据
        const labels = data.budgetItems.map(item => item.name);
        const budgetData = data.budgetItems.map(item => item.amount);
        const usedData = data.budgetItems.map(item => item.used);
        
        // 检测是否为移动设备
        const isMobile = window.innerWidth < 768;
        
        // 如果已有图表实例，先销毁
        if (window.budgetChartInstance) {
            window.budgetChartInstance.destroy();
        }
        
        // 创建新图表
        window.budgetChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: '预算金额',
                    data: budgetData,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(236, 72, 153, 0.7)',
                        'rgba(249, 115, 22, 0.7)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(249, 115, 22, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: isMobile ? 'bottom' : 'right',
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: isMobile ? 10 : 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const used = usedData[context.dataIndex] || 0;
                                return `${label}: 预算 ¥${value.toFixed(2)} (已用 ¥${used.toFixed(2)})`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    // 渲染收支趋势图表
    renderTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        // 获取过去6个月的数据
        const monthsData = [];
        const currentDate = new Date(appData.currentMonth);
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            
            const monthData = appData.data[key] || { income: 0, disposable: 0, budgetItems: [] };
            const totalBudget = monthData.budgetItems.reduce((total, item) => total + item.amount, 0);
            
            monthsData.push({
                month: `${year}年${month}月`,
                income: monthData.income,
                disposable: monthData.disposable,
                budget: totalBudget
            });
        }
        
        // 检测是否为移动设备
        const isMobile = window.innerWidth < 768;
        
        // 如果已有图表实例，先销毁
        if (window.trendChartInstance) {
            window.trendChartInstance.destroy();
        }
        
        // 创建新图表
        window.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthsData.map(item => item.month),
                datasets: [
                    {
                        label: '月收入',
                        data: monthsData.map(item => item.income),
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: '可支配金额',
                        data: monthsData.map(item => item.disposable),
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: '总预算',
                        data: monthsData.map(item => item.budget),
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value;
                            },
                            font: {
                                size: isMobile ? 9 : 11
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: isMobile ? 9 : 11
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: isMobile ? 9 : 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += '¥' + context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    },
    
    // 渲染健康度图表
    renderHealthChart() {
        const ctx = document.getElementById('healthChart').getContext('2d');
        const healthScore = appData.getHealthScore();
        
        // 确定颜色
        let color = 'rgba(239, 68, 68, 0.7)'; // 红色
        if (healthScore > 30) color = 'rgba(245, 158, 11, 0.7)'; // 黄色
        if (healthScore > 70) color = 'rgba(16, 185, 129, 0.7)'; // 绿色
        
        // 如果已有图表实例，先销毁
        if (window.healthChartInstance) {
            window.healthChartInstance.destroy();
        }
        
        // 创建新图表
        window.healthChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [healthScore, 100 - healthScore],
                    backgroundColor: [
                        color,
                        'rgba(203, 213, 225, 0.3)'
                    ],
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
    },
    
    // 更新支出项目选择下拉框
    updateExpenseItemSelect() {
        const data = appData.getCurrentMonthData();
        const select = document.getElementById('expenseItem');
        const currentValue = select.value;
        
        // 保存第一个选项
        const firstOption = select.options[0];
        
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        data.budgetItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (预算: ¥${item.amount.toFixed(2)})`;
            select.appendChild(option);
        });
        
        // 恢复之前的选择
        if (currentValue) {
            select.value = currentValue;
        }
    },
    
    // 显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        const modalContent = document.getElementById(`${modalId}Content`);
        
        // 检查元素是否存在
        if (!modal || !modalContent) {
            console.error(`Modal elements not found: ${modalId} or ${modalId}Content`);
            return;
        }
        
        modal.classList.remove('hidden');
        // 触发重排后添加动画类
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100', 'transition-all', 'duration-300');
        }, 10);
        
        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
    },
    
    // 隐藏模态框
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        const modalContent = document.getElementById(`${modalId}Content`);
        
        if (!modal || !modalContent) {
            console.error(`Modal elements not found: ${modalId} or ${modalId}Content`);
            return;
        }
        
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            // 恢复背景滚动
            document.body.style.overflow = '';
        }, 300);
    },
    
    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    
    // 绑定事件处理程序
    bindEvents() {
        // 导航栏滚动效果
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 10) {
                navbar.classList.add('py-2');
                navbar.classList.remove('py-3');
            } else {
                navbar.classList.add('py-3');
                navbar.classList.remove('py-2');
            }
        });
        
        // 月份选择器
        document.getElementById('monthSelect').addEventListener('change', (e) => {
            const [year, month] = e.target.value.split('-').map(Number);
            appData.currentMonth = new Date(year, month - 1, 1);
            this.updateMonthDisplay();
            this.renderAll();
        });
        
        // 上一个月/下一个月按钮
        const prevBtn = document.getElementById('prevMonth');
        prevBtn.addEventListener('click', () => {
            appData.prevMonth();
            this.updateMonthDisplay();
            this.renderAll();
        });
        prevBtn.addEventListener('touchstart', () => {
            prevBtn.classList.add('bg-white/30');
        });
        prevBtn.addEventListener('touchend', () => {
            prevBtn.classList.remove('bg-white/30');
        });
        
        const nextBtn = document.getElementById('nextMonth');
        nextBtn.addEventListener('click', () => {
            appData.nextMonth();
            this.updateMonthDisplay();
            this.renderAll();
        });
        nextBtn.addEventListener('touchstart', () => {
            nextBtn.classList.add('bg-white/30');
        });
        nextBtn.addEventListener('touchend', () => {
            nextBtn.classList.remove('bg-white/30');
        });
        
        // 编辑月收入
        const editIncomeBtn = document.getElementById('editIncome');
        editIncomeBtn.addEventListener('click', () => {
            this.showModal('incomeModal');
        });
        
        // 关闭收入模态框
        document.getElementById('closeIncomeModal').addEventListener('click', () => {
            this.hideModal('incomeModal');
        });
        
        // 保存月收入
        document.getElementById('saveIncome').addEventListener('click', () => {
            const amount = document.getElementById('incomeAmount').value;
            if (amount) {
                appData.updateIncome(amount);
                this.renderIncome();
                this.renderSummary();
                this.renderCharts();
                this.hideModal('incomeModal');
            }
        });
        
        // 编辑可支配金额
        document.getElementById('editDisposable').addEventListener('click', () => {
            this.showModal('disposableModal');
        });
        
        // 关闭可支配金额模态框
        document.getElementById('closeDisposableModal').addEventListener('click', () => {
            this.hideModal('disposableModal');
        });
        
        // 保存可支配金额
        document.getElementById('saveDisposable').addEventListener('click', () => {
            const amount = document.getElementById('disposableAmountInput').value;
            if (amount) {
                appData.updateDisposable(amount);
                this.renderDisposable();
                this.renderSummary();
                this.renderCharts();
                this.hideModal('disposableModal');
            }
        });
        
        // 添加预算项目
        document.getElementById('addBudgetItem').addEventListener('click', () => {
            document.getElementById('budgetItemModalTitle').textContent = '添加预算项目';
            document.getElementById('budgetItemId').value = '';
            document.getElementById('budgetItemName').value = '';
            document.getElementById('budgetItemAmount').value = '';
            this.showModal('budgetItemModal');
        });
        
        // 关闭预算项目模态框
        document.getElementById('closeBudgetItemModal').addEventListener('click', () => {
            this.hideModal('budgetItemModal');
        });
        
        // 保存预算项目
        document.getElementById('saveBudgetItem').addEventListener('click', () => {
            const id = document.getElementById('budgetItemId').value;
            const name = document.getElementById('budgetItemName').value;
            const amount = document.getElementById('budgetItemAmount').value;
            
            if (name && amount) {
                if (id) {
                    appData.updateBudgetItem(id, name, amount);
                } else {
                    appData.addBudgetItem(name, amount);
                }
                
                this.renderBudgetItems();
                this.renderSummary();
                this.renderCharts();
                this.updateExpenseItemSelect();
                this.hideModal('budgetItemModal');
            }
        });
        
        // 编辑预算项目
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-budget-item')) {
                const id = e.target.closest('.edit-budget-item').dataset.id;
                const data = appData.getCurrentMonthData();
                const item = data.budgetItems.find(item => item.id === id);
                
                if (item) {
                    document.getElementById('budgetItemModalTitle').textContent = '编辑预算项目';
                    document.getElementById('budgetItemId').value = item.id;
                    document.getElementById('budgetItemName').value = item.name;
                    document.getElementById('budgetItemAmount').value = item.amount;
                    this.showModal('budgetItemModal');
                }
            }
        });
        
        // 删除预算项目
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-budget-item')) {
                const id = e.target.closest('.delete-budget-item').dataset.id;
                if (confirm('确定要删除这个预算项目吗？相关的支出记录也会被删除。')) {
                    appData.deleteBudgetItem(id);
                    this.renderBudgetItems();
                    this.renderExpenses();
                    this.renderSummary();
                    this.renderCharts();
                    this.updateExpenseItemSelect();
                }
            }
        });
        
        // 添加支出记录
        document.getElementById('addExpense').addEventListener('click', () => {
            document.getElementById('expenseModalTitle').textContent = '添加支出记录';
            document.getElementById('expenseId').value = '';
            document.getElementById('expenseDate').value = this.formatDate(new Date());
            document.getElementById('expenseItem').value = '';
            document.getElementById('expenseAmount').value = '';
            document.getElementById('expenseNote').value = '';
            this.showModal('expenseModal');
        });
        
        // 关闭支出模态框
        document.getElementById('closeExpenseModal').addEventListener('click', () => {
            this.hideModal('expenseModal');
        });
        
        // 保存支出记录
        document.getElementById('saveExpense').addEventListener('click', () => {
            const id = document.getElementById('expenseId').value;
            const date = document.getElementById('expenseDate').value;
            const budgetId = document.getElementById('expenseItem').value;
            const amount = document.getElementById('expenseAmount').value;
            const note = document.getElementById('expenseNote').value;
            
            if (date && budgetId && amount) {
                if (id) {
                    appData.updateExpense(id, date, budgetId, amount, note);
                } else {
                    appData.addExpense(date, budgetId, amount, note);
                }
                
                this.renderBudgetItems();
                this.renderExpenses();
                this.renderSummary();
                this.renderCharts();
                this.hideModal('expenseModal');
            }
        });
        
        // 编辑支出记录
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-expense')) {
                const id = e.target.closest('.edit-expense').dataset.id;
                const data = appData.getCurrentMonthData();
                const expense = data.expenses.find(exp => exp.id === id);
                
                if (expense) {
                    document.getElementById('expenseModalTitle').textContent = '编辑支出记录';
                    document.getElementById('expenseId').value = expense.id;
                    document.getElementById('expenseDate').value = expense.date;
                    document.getElementById('expenseItem').value = expense.budgetId;
                    document.getElementById('expenseAmount').value = expense.amount;
                    document.getElementById('expenseNote').value = expense.note;
                    this.showModal('expenseModal');
                }
            }
        });
        
        // 删除支出记录
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-expense')) {
                const id = e.target.closest('.delete-expense').dataset.id;
                if (confirm('确定要删除这条支出记录吗？')) {
                    appData.deleteExpense(id);
                    this.renderBudgetItems();
                    this.renderExpenses();
                    this.renderSummary();
                    this.renderCharts();
                }
            }
        });
        
        // 主题切换
        document.getElementById('themeToggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = document.getElementById('themeToggle').querySelector('i');
            if (icon.classList.contains('fa-moon-o')) {
                icon.classList.remove('fa-moon-o');
                icon.classList.add('fa-sun-o');
            } else {
                icon.classList.remove('fa-sun-o');
                icon.classList.add('fa-moon-o');
            }
        });
        
        // 点击模态框外部关闭
        const modals = ['incomeModal', 'disposableModal', 'budgetItemModal', 'expenseModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modalId);
                }
            });
        });
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    appData.init();
    uiController.init();
});
    