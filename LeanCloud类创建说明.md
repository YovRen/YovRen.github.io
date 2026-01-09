# LeanCloud 类创建说明

## 需要创建的类

### 1. todolist（待办事项）

**字段：**

- `title` (String) - 待办事项标题
- `done` (Boolean) - 是否完成，默认 false
- `importance` (String) - 重要性：'high' 或 'low'
- `urgency` (String) - 紧急度：'high' 或 'low'
- `quadrant` (Number) - 象限：1, 2, 3, 或 4
- `archived` (Boolean) - 是否已存档，默认 false
- `deadline` (Date) - 截止日期（可选）
- `completedDate` (Date) - 完成日期（可选）

**权限设置：**

- 客户端创建：允许
- 客户端读取：所有人
- 客户端更新：所有人
- 客户端删除：所有人

---

### 2. journal（日记）

**字段：**

- `title` (String) - 日记标题
- `content` (String) - 日记内容（Markdown格式）
- `mood` (String) - 心情标签，默认 '😊'
- `city` (String) - 城市
- `weather` (String) - 天气
- `time` (String) - 时间字符串
- `author` (String) - 作者：'小燃' 或 '梦竹'
- `image` (File) - 图片文件（可选）

**权限设置：**

- 客户端创建：允许
- 客户端读取：所有人
- 客户端更新：所有人
- 客户端删除：所有人

---

### 3. blog（博客）

**字段：**

- `title` (String) - 博客标题
- `content` (String) - 博客内容（Markdown格式）
- `tags` (String) - 标签（逗号分隔）
- `time` (String) - 时间字符串
- `author` (String) - 作者：'小燃' 或 '梦竹'

**权限设置：**

- 客户端创建：允许
- 客户端读取：所有人
- 客户端更新：所有人
- 客户端删除：所有人

---

### 4. calendarevent（日历事件）

**字段：**

- `title` (String) - 事件标题
- `content` (String) - 事件内容（Markdown格式，可选）
- `date` (String) - 日期，格式：YYYY-MM-DD
- `priority` (String) - 优先级：'low', 'medium', 或 'high'

**权限设置：**

- 客户端创建：允许
- 客户端读取：所有人
- 客户端更新：所有人
- 客户端删除：所有人

---

### 5. note（便签）

**字段：**

- `content` (String) - 便签内容
- `color` (String) - 便签颜色（十六进制颜色值，如 '#fff9c4'）
- `user` (Pointer) - 指向 _User 的用户指针

**权限设置：**

- 客户端创建：允许
- 客户端读取：所有人
- 客户端更新：所有人
- 客户端删除：所有人

---

## 创建步骤

1. 登录 LeanCloud 控制台
2. 进入你的应用
3. 点击左侧菜单「数据存储」→「结构化数据」
4. 点击「创建 Class」按钮
5. 输入类名（注意大小写要完全匹配）
6. 选择「无限制」或「标准版」（根据你的需求）
7. 点击「创建」

## 权限设置步骤

1. 创建类后，点击类名进入详情
2. 点击「权限」标签
3. 设置「客户端」权限：
   - 创建：允许
   - 读取：所有人
   - 更新：所有人
   - 删除：所有人

## 注意事项

1. **类名大小写敏感**：必须完全匹配代码中的类名
   - `todolist`（全小写）
   - `journal`（全小写）
   - `blog`（全小写）
   - `calendarevent`（全小写）
   - `note`（全小写）

2. **字段会自动创建**：如果字段不存在，LeanCloud 会在首次保存时自动创建，但建议手动创建以便设置正确的类型

3. **如果类已存在**：如果类已经存在（如你截图中的 `Todolist` 和 `Diary`），需要创建新的 `journal` 类，或使用数据迁移方案将 `Diary` 数据迁移到 `journal`

4. **数据安全**：在「设置」→「应用选项」→「数据安全」中，确保：
   - 「允许客户端创建 Class」已开启
   - 或者手动创建所有需要的类

## 快速检查清单

- [ ] todolist 类已创建
- [ ] journal 类已创建
- [ ] blog 类已创建
- [ ] calendarevent 类已创建
- [ ] note 类已创建
- [ ] 所有类的权限设置正确
- [ ] 数据安全设置允许客户端创建（或已手动创建所有类）
