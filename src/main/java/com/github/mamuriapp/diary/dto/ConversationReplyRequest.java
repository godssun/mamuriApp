package com.github.mamuriapp.diary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 대화 답장 요청 DTO.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ConversationReplyRequest {

    @NotBlank(message = "메시지를 입력해주세요.")
    @Size(max = 500, message = "메시지는 500자를 초과할 수 없습니다.")
    private String content;
}
