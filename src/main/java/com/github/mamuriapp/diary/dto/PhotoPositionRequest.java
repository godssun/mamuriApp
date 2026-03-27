package com.github.mamuriapp.diary.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사진 캔버스 좌표 업데이트 요청 DTO.
 */
@Getter
@NoArgsConstructor
public class PhotoPositionRequest {

    private Double positionX;
    private Double positionY;
    private Integer displayWidth;
    private Integer displayHeight;
    private Integer zIndex;
}
