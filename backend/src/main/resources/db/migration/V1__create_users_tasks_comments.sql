CREATE TABLE users (
    id UUID PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description VARCHAR(5000),
    status VARCHAR(20) NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    assigned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_user_status ON tasks (assigned_user_id, status);
CREATE INDEX idx_tasks_user_due_date ON tasks (assigned_user_id, due_date);

CREATE TABLE comments (
    id UUID PRIMARY KEY,
    content VARCHAR(3000) NOT NULL,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_comments_task_created_at ON comments (task_id, created_at);
