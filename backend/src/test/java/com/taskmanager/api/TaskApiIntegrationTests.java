package com.taskmanager.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registrationIssuesHttpOnlyRefreshCookieAndRotatesToken() throws Exception {
        Session session = register(uniqueEmail());
        assertThat(session.refreshToken()).isNotBlank();

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new MockCookie("refresh_token", session.refreshToken())))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andReturn();

        String rotated = refreshResult.getResponse().getCookie("refresh_token").getValue();
        assertThat(rotated).isNotEqualTo(session.refreshToken());

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new MockCookie("refresh_token", session.refreshToken())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("The refresh token is invalid or expired."));
    }

    @Test
    void taskAccessIsOwnerScopedAndStatusCanBeChanged() throws Exception {
        Session owner = register(uniqueEmail());
        Session otherUser = register(uniqueEmail());

        MvcResult createResult = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", bearer(owner.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Prepare project review",
                                  "description": "Collect current project updates",
                                  "status": "TODO",
                                  "priority": "HIGH",
                                  "dueDate": null
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Prepare project review"))
                .andReturn();
        JsonNode response = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String taskId = response.path("data").path("id").asText();

        mockMvc.perform(get("/api/tasks/{id}", taskId)
                        .header("Authorization", bearer(otherUser.accessToken())))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/tasks/{id}/status", taskId)
                        .header("Authorization", bearer(owner.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"));

        mockMvc.perform(get("/api/tasks/summary")
                        .header("Authorization", bearer(owner.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.completed").value(1));
    }

    @Test
    void privateEndpointsRejectMissingAccessToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void loginNormalizesEmailAndLogoutRevokesRefreshToken() throws Exception {
        String email = uniqueEmail();
        register(email);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(
                                email.toUpperCase(), "safe-password-123"))))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andReturn();
        String refreshToken = loginResult.getResponse().getCookie("refresh_token").getValue();

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(new MockCookie("refresh_token", refreshToken)))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("refresh_token", 0));

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new MockCookie("refresh_token", refreshToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void commentsAreReturnedOnlyToTheTaskOwner() throws Exception {
        Session owner = register(uniqueEmail());
        Session otherUser = register(uniqueEmail());
        MvcResult taskResult = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", bearer(owner.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Review acceptance criteria",
                                  "description": null,
                                  "status": "IN_PROGRESS",
                                  "priority": "MEDIUM",
                                  "dueDate": null
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String taskId = objectMapper.readTree(taskResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(post("/api/tasks/{id}/comments", taskId)
                        .header("Authorization", bearer(owner.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"The criteria are ready for review.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.authorName").value("Test User"));

        mockMvc.perform(get("/api/tasks/{id}/comments", taskId)
                        .header("Authorization", bearer(owner.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].content")
                        .value("The criteria are ready for review."));

        mockMvc.perform(get("/api/tasks/{id}/comments", taskId)
                        .header("Authorization", bearer(otherUser.accessToken())))
                .andExpect(status().isNotFound());
    }

    private Session register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                "Test User", email, "safe-password-123"))))
                .andExpect(status().isCreated())
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andReturn();
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return new Session(
                response.path("data").path("accessToken").asText(),
                result.getResponse().getCookie("refresh_token").getValue());
    }

    private String uniqueEmail() {
        return UUID.randomUUID() + "@example.test";
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record Session(String accessToken, String refreshToken) {
    }
}
