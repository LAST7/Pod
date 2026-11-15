PRAGMA foreign_keys = ON;


CREATE TABLE IF NOT EXISTS captures (
    id TEXT PRIMARY KEY,
    raw_content TEXT NOT NULL,
    source_type TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    capture_id TEXT REFERENCES captures (id) ON DELETE SET NULL,
    parent_id TEXT REFERENCES tasks (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    abandon_reason TEXT,
    time_scope TEXT NOT NULL DEFAULT 'day',
    start_date TEXT,
    due_date TEXT,
    deferred_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);


CREATE TABLE IF NOT EXISTS task_dependencies (
    predecessor_id TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    successor_id TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    dependency_type TEXT DEFAULT 'blocks',
    PRIMARY KEY (predecessor_id, successor_id)
);


CREATE TABLE IF NOT EXISTS log_toolcall (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    toolcall_id TEXT,
    raw_human_command TEXT,
    tool_name TEXT NOT NULL,
    input_args TEXT NOT NULL,
    execution_result TEXT,
    undo_payload TEXT,
    is_undone INTEGER DEFAULT 0,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
