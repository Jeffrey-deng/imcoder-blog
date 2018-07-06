package com.blog.controller.json;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class LongToDateStrJsonSerializer_Two extends JsonSerializer<Long> {

	@Override
	public void serialize(Long value, JsonGenerator jgen, SerializerProvider arg2)
			throws IOException, JsonProcessingException {
		//Locale 指定为中文，因为阿里云服务器是英文系统
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy年MM月dd日(E) ahh:mm", Locale.SIMPLIFIED_CHINESE);
		String formattedDate = sdf.format(new Date(value));
		jgen.writeString(formattedDate);
	}
} 
