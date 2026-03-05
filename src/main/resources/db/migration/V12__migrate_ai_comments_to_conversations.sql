-- 기존 AI 코멘트를 conversation_messages의 첫 메시지(sequence_number=0)로 복사
INSERT INTO conversation_messages (diary_id, user_id, role, content, sequence_number,
    model_name, prompt_version, created_at)
SELECT ac.diary_id, d.user_id, 'AI', ac.content, 0,
    ac.model_name, ac.prompt_version, ac.created_at
FROM ai_comments ac
JOIN diaries d ON ac.diary_id = d.id
WHERE NOT EXISTS (
    SELECT 1 FROM conversation_messages cm
    WHERE cm.diary_id = ac.diary_id AND cm.sequence_number = 0
);
