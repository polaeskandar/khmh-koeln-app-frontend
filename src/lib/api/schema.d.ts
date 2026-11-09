export type paths = {
  "/services/insights": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_services_insights"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/account-requests": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_account_requests_list"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/account-requests/member-candidates": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_account_requests_member_candidates"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/account-requests/{id}/approve": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_account_requests_approve"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/account-requests/{id}/decline": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_account_requests_decline"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/email-confirmations": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_auth_email_confirmations"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/forgot-password": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_auth_forgot_password"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/me": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_me"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/me/language": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never

    put: operations["put_api_me_language"]
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/member-accounts": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_member_accounts_list"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/member-accounts/{id}/unlink": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_member_accounts_unlink"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/member/servants": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_member_servants"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/me/password": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_me_password"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/password-links": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_auth_password_links"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/register": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_auth_register"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/register/services": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_auth_register_services"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/roles": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_roles_list"]
    put?: never

    post: operations["post_api_roles_create"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/roles/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_roles_show"]

    put: operations["put_api_roles_edit"]
    post?: never

    delete: operations["delete_api_roles_delete"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/sign-in": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_auth_sign_in"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/sign-out": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_auth_sign_out"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/staff-accounts": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_staff_accounts"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/accounts/{id}/roles": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_account_roles_give"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/accounts/{id}/roles/{roleId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never

    delete: operations["delete_api_account_roles_take"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/accounts/{id}/password-link": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_account_password_link"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/tokens": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_auth_tokens"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/auth/tokens/current": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never

    delete: operations["delete_api_auth_tokens_current"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/stages/{stageId}/homework": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_homework_list"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/lessons/{lessonId}/homework": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_homework_create"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/homework/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_homework_show"]

    put: operations["put_api_homework_edit"]
    post?: never

    delete: operations["delete_api_homework_delete"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/homework/{id}/publish": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_homework_publish"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/homework/{id}/progress": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_homework_progress"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/homework/{id}/unpublish": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_homework_unpublish"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/homework/{id}/archive": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_homework_archive"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/homework/{id}/restore": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_homework_restore"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/lessons/{id}/archive": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_lessons_archive"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/lessons/{id}/restore": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_lessons_restore"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/lessons/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_lessons_show"]

    put: operations["put_api_lessons_edit"]
    post?: never

    delete: operations["delete_api_lessons_delete"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/stages/{stageId}/lesson-options": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_lesson_options"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/stages/{stageId}/lessons": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_lessons_list"]
    put?: never

    post: operations["post_api_lessons_create"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/lessons/{id}/status": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_lessons_status"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/member/homework": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_member_homework_list"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/member/homework/{homeworkId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_member_homework_show"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/member/homework/{homeworkId}/completion": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never

    put: operations["put_api_member_homework_report"]
    post?: never

    delete: operations["delete_api_member_homework_undo"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/parent/children/{childId}/homework": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_parent_homework_list"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/parent/children/{childId}/homework/{homeworkId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_parent_homework_show"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/parent/children/{childId}/homework/{homeworkId}/completion": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never

    put: operations["put_api_parent_homework_report"]
    post?: never

    delete: operations["delete_api_parent_homework_undo"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/agenda": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_agenda"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{id}/attendance": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_attendance_board"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{id}/attendance/corrections": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_attendance_corrections"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{sessionId}/attendance/{personId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never

    put: operations["put_api_attendance_mark"]
    post?: never

    delete: operations["delete_api_attendance_remove"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/attendance/overview": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_attendance_overview"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/attendance/counts": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_attendance_counts"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/dashboard/upcoming": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_dashboard_upcoming"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/member/meetings": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_member_meetings"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/schedules/{id}/activate": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_schedules_activate"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/schedules/{id}/deactivate": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_schedules_deactivate"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/schedules/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_schedules_show"]

    put: operations["put_api_schedules_edit"]
    post?: never

    delete: operations["delete_api_schedules_delete"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/schedules": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_schedules_list"]
    put?: never

    post: operations["post_api_schedules_create"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/schedules/{id}/occurrences/{date}/cancel": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_schedules_cancel_occurrence"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_sessions_create"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{id}/details": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never

    put: operations["put_api_sessions_details"]
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_sessions_show"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{id}/open": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_sessions_open"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{id}/close": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_sessions_close"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{id}/reopen": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_sessions_reopen"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{id}/cancel": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_sessions_cancel"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/stages/{id}/attendance-history": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_stages_attendance_history"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/service-leaders": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_service_leaders"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/services": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_services_list"]
    put?: never

    post: operations["post_api_services_create"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/services/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_services_show"]

    put: operations["put_api_services_edit"]
    post?: never

    delete: operations["delete_api_services_delete"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/services/{id}/stages": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_stages_list"]
    put?: never

    post: operations["post_api_stages_add"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/services/{id}/stages/order": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never

    put: operations["put_api_stages_reorder"]
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/stages/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_stages_show"]

    put: operations["put_api_stages_edit"]
    post?: never

    delete: operations["delete_api_stages_delete"]
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/services/{id}/archive": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_services_archive"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/services/{id}/restore": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_services_restore"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/stages/{id}/archive": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_stages_archive"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/stages/{id}/restore": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_stages_restore"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/people/directory": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_people_directory"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/guardian-links": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_guardian_links_list"]
    put?: never

    post: operations["post_api_guardian_links_give"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/guardian-links/{id}/revoke": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_guardian_links_revoke"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/member/groups": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_member_groups"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/people/{id}/memberships": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_people_memberships_add"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/memberships/{id}/move": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_memberships_move"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/memberships/{id}/end": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_memberships_end"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/parent/children": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_parent_children"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/people": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_people_list"]
    put?: never

    post: operations["post_api_people_create"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/people/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never

    put: operations["put_api_people_rename"]
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/people/{id}/deactivate": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_people_deactivate"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/people/{id}/reactivate": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_people_reactivate"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/data-requests/{id}/erasure": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_data_requests_erasure_review"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/data-requests/{id}/erase": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never

    post: operations["post_api_data_requests_erase"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/data-requests": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_data_requests_list"]
    put?: never

    post: operations["post_api_data_requests_record"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/data-requests/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_data_requests_show"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/me/personal-data": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_me_personal_data"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/me/erasure-request": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_me_erasure_request"]
    put?: never

    post: operations["post_api_me_request_erasure"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/health": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_health"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/health/ready": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_health_ready"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/openapi.json": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_openapi"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export type components = {
  schemas: {
    Liveness: {
      status: "ok"
    }
    Problem: {
      status: number
      code: string
      params: Record<string, never>
      fieldErrors?: {
        [key: string]: {
          code: string
          params: Record<string, never>
        }
      }
    }
    MemberApprovalRequest: {
      personId?: string | null

      ageCheck?: string | null

      guardianConsentNote?: string | null
    }
    ApprovalRequest: {
      as?: "parent" | "servant" | "member" | null

      childIds?: string[]

      roleIds?: string[]

      member?: components["schemas"]["MemberApprovalRequest"]
    }
    ConfirmEmailRequest: {
      token?: string | null
    }
    ForgotPasswordRequest: {
      email?: string | null
    }
    ChangeLanguageRequest: {
      language?: string | null
    }
    ChangePasswordRequest: {
      currentPassword?: string | null

      newPassword?: string | null
    }
    SetPasswordFromLinkRequest: {
      token?: string | null

      password?: string | null
    }
    AccountRequest: {
      firstName?: string | null

      lastName?: string | null

      email?: string | null

      password?: string | null

      language?: "en" | "de" | "ar" | null
    }
    RegistrationRequest: {
      registeredAs?: "parent" | "servant" | "member" | null

      note?: string | null

      serviceIds?: string[]
    }
    PrivacyRequest: {
      accepted?: boolean | null

      version?: string | null
    }
    RegisterAccountRequest: {
      account?: components["schemas"]["AccountRequest"]

      registration?: components["schemas"]["RegistrationRequest"]

      privacy?: components["schemas"]["PrivacyRequest"]
    }
    PermissionRequest: {
      action?: string | null

      resource?: string | null
    }
    RoleRequest: {
      name?: string | null

      permissions?: components["schemas"]["PermissionRequest"][]
    }
    GiveAccountRoleRequest: {
      roleId?: string | null
    }
    HomeworkRequest: {
      title?: string | null

      instructions?: string | null

      dueDate?: string | null

      resources?: {
        [key: string]: string | null
      }[]
    }
    LessonOptionsQueryRequest: {
      lessonId?: string | null
    }
    LessonListQueryRequest: {
      tab?: "upcoming" | "previous" | "archived"

      q?: string | null
    }
    LessonDetailsRequest: {
      title?: string | null

      summary?: string | null

      passage?: string | null

      memoryVerse?: string | null

      collaboratorIds?: string[] | null
    }
    LessonMeetingRequest: {
      scheduleId?: string | null

      sessionId?: string | null

      date?: string | null
    }
    LessonPlanRequest: {
      objectives?: string | null

      teachingPoints?: string | null

      activities?: string | null

      notes?: string | null

      materials?: {
        [key: string]: string | null
      }[]
    }
    LessonRequest: {
      details?: components["schemas"]["LessonDetailsRequest"]

      meeting?: components["schemas"]["LessonMeetingRequest"]

      plan?: components["schemas"]["LessonPlanRequest"]

      responsibleId?: string | null

      status?: "draft" | "ready" | null
    }
    LessonStatusRequest: {
      status?: "draft" | "ready" | "completed" | null
    }
    ChildHomeworkQueryRequest: {
      state?: "todo" | "done"
    }
    AgendaQueryRequest: {
      from?: string | null

      to?: string | null

      serviceId?: string | null

      stageId?: string | null

      scheduleId?: string | null
    }
    RemovalRequest: {
      reason?: string | null
    }
    AttendanceCountsRequest: {
      sessionIds?: string[]
    }
    RosterRequest: {
      serviceId?: string | null

      stageId?: string | null

      mode?: "expected" | "open" | null
    }
    DetailsRequest: {
      name?: string | null

      description?: string | null

      location?: string | null
    }
    SpanRequest: {
      startsOn?: string | null

      endsOn?: string | null
    }
    RecurrenceRequest: {
      frequency?: "weekly" | "monthly" | null

      interval?: number | null

      weekdays?: number[]

      monthWeek?: number | null

      span?: components["schemas"]["SpanRequest"]
    }
    TimesRequest: {
      startTime?: string | null

      endTime?: string | null
    }
    CreateScheduleRequest: {
      roster?: components["schemas"]["RosterRequest"]

      details?: components["schemas"]["DetailsRequest"]

      recurrence?: components["schemas"]["RecurrenceRequest"]

      times?: components["schemas"]["TimesRequest"]
    }
    ScheduleChangesRequest: {
      details?: components["schemas"]["DetailsRequest"]

      recurrence?: components["schemas"]["RecurrenceRequest"]

      times?: components["schemas"]["TimesRequest"]

      rosterMode?: "expected" | "open" | null
    }
    ReasonRequest: {
      reason?: string | null
    }
    OneOffSessionRequest: {
      roster?: components["schemas"]["RosterRequest"]

      title?: string | null

      location?: string | null

      startsAt?: string | null

      endsAt?: string | null
    }
    SessionDetailsRequest: {
      title?: string | null

      location?: string | null
    }
    ServiceRequest: {
      name?: string | null

      description?: string | null
    }
    StageOrderRequest: {
      stageIds?: string[] | null
    }
    StageRequest: {
      name?: string | null

      description?: string | null
    }
    ParentAccessRequest: {
      userId?: string | null

      personId?: string | null

      relationship?: "parent" | "guardian"
    }
    PlacementRequest: {
      serviceId?: string | null

      stageId?: string | null
    }
    MoveMembershipRequest: {
      stageId?: string | null
    }
    PeopleQueryRequest: {
      status?: "active" | "inactive" | "all"

      serviceId?: string | null

      stageId?: string | null

      q?: string

      page?: number
    }
    CreatePersonRequest: {
      firstName?: string | null

      lastName?: string | null

      displayName?: string | null

      placement?: components["schemas"]["PlacementRequest"] | null

      confirmDuplicate?: boolean
    }
    RenamePersonRequest: {
      firstName?: string | null

      lastName?: string | null

      displayName?: string | null
    }
    EraseRequestRequest: {
      clearNotes?: boolean | null
    }
    RequestSubjectRequest: {
      personId?: string | null

      accountId?: string | null
    }
    ReceiptRequest: {
      requestedBy?: string | null

      channel?: "email" | "letter" | "in_person" | null

      receivedOn?: string | null
    }
    RecordDataRequestRequest: {
      kind?: "erasure" | "copy" | null

      subject?: components["schemas"]["RequestSubjectRequest"]

      receipt?: components["schemas"]["ReceiptRequest"]

      note?: string | null
    }
    OwnErasureRequestRequest: {
      note?: string | null
    }
    StageSummary: {
      id: string
      name: string
      position: number
    }
    NextMeeting: {
      date: string
      startTime: string
      stage: components["schemas"]["StageSummary"] | null
      status: string
    }
    AttendanceTrend: {
      sessions: number

      rate: number | null
      averagePresent: number | null
    }
    ArchiveImpact: {
      activeSchedules: number
      upcomingSessions: number
    }
    ServiceInsight: {
      serviceId: string
      next: components["schemas"]["NextMeeting"] | null
      trend: components["schemas"]["AttendanceTrend"]
      impact: components["schemas"]["ArchiveImpact"]
    }

    Language: "en" | "de" | "ar"
    AccountSummary: {
      id: string
      email: string
      displayName: string
      language: components["schemas"]["Language"]
    }

    RegisteredAs: "parent" | "servant" | "member"
    ServiceReference: {
      id: string
      name: string
      tone: number
      archived: boolean
    }
    AccountRequest2: {
      account: components["schemas"]["AccountSummary"]

      registeredAt: string
      registeredAs: components["schemas"]["RegisteredAs"] | null
      note: string | null
      services: components["schemas"]["ServiceReference"][]
    }
    RoleSummary: {
      id: string
      name: string
    }
    AccountRequestListResponse: {
      items: components["schemas"]["AccountRequest2"][]
      roles: components["schemas"]["RoleSummary"][]
      today: string
    }
    StageReference: {
      id: string
      name: string
      position: number
      archived: boolean
    }
    PersonGroup: {
      service: components["schemas"]["ServiceReference"]
      stage: components["schemas"]["StageReference"] | null
    }
    MemberCandidateResponse: {
      displayName: string | null
      firstName: string
      groups: components["schemas"]["PersonGroup"][]
      hasAccount: boolean
      id: string
      lastName: string
    }
    MemberCandidateListResponse: {
      items: components["schemas"]["MemberCandidateResponse"][]
    }
    AccountResponse: {
      id: string
      email: string
      displayName: string
      language: components["schemas"]["Language"]
    }
    RoleResponse: {
      id: string
      name: string
    }

    Action: "create" | "read" | "update" | "delete"

    Resource:
      | "users"
      | "roles"
      | "services"
      | "stages"
      | "sessions"
      | "attendance"
      | "members"
      | "lessons"
      | "homework"
      | "parentPortal"
    PermissionResponse: {
      action: components["schemas"]["Action"]
      resource: components["schemas"]["Resource"]
    }
    MemberSummaryResponse: {
      personId: string
      groupCount: number
    }
    MeResponse: {
      account: components["schemas"]["AccountResponse"]
      roles: components["schemas"]["RoleResponse"][]
      permissions: components["schemas"]["PermissionResponse"][]
      today: string
      member: components["schemas"]["MemberSummaryResponse"] | null
    }

    AgeCheck: "sixteenOrOlder" | "guardianConsent"
    AccountReference: {
      id: string
      name: string
    }
    MemberAccountItemResponse: {
      ageCheck: components["schemas"]["AgeCheck"] | null

      approvedAt: string | null
      approvedBy: components["schemas"]["AccountReference"] | null
      disabled: boolean
      email: string
      guardianConsentNote: string | null
      id: string
      isParent: boolean
      member: {
        groups: string[]
        id: string
        inactive: boolean
        name: string | null
      }
      name: string
    }
    MemberAccountListResponse: {
      today: string
      items: components["schemas"]["MemberAccountItemResponse"][]
    }
    GroupServant: {
      id: string
      name: string
      role: string
    }
    RegistrationReceivedResponse: {
      status: string
    }
    ServiceOptionResponse: {
      id: string
      name: string
    }
    RegistrationServicesResponse: {
      items: components["schemas"]["ServiceOptionResponse"][]
    }
    RoleRowResponse: {
      id: string
      name: string
      permissions: components["schemas"]["PermissionResponse"][]
      holderCount: number
    }
    RoleListResponse: {
      items: components["schemas"]["RoleRowResponse"][]
    }
    RoleHolderResponse: {
      id: string
      displayName: string
      email: string
      disabled: boolean
    }
    RoleDetailsResponse: {
      createdAt: string
      holders: components["schemas"]["RoleHolderResponse"][]
      id: string
      name: string
      onlyWayToChangeRoles: boolean
      permissions: components["schemas"]["PermissionResponse"][]

      updatedAt: string
    }
    StaffAccount: {
      id: string
      displayName: string
      email: string
      disabled: boolean
      roles: components["schemas"]["RoleSummary"][]
    }
    StaffAccountList: {
      items: components["schemas"]["StaffAccount"][]
      today: string
    }
    IssuedPasswordLink: {
      expiresAt: string
    }
    AudienceCountsResponse: {
      assigned: number
      completed: number
      completedAfterDueDate: number
      notCompleted: number
      reportedTotal: number
      withoutAccount: number
      withoutParentAccount: number
    }
    LessonOnDate: {
      id: string
      title: string
      teachingDate: string
      archived: boolean
    }

    HomeworkStatus: "draft" | "published" | "archived"
    HomeworkItemResponse: {
      counts: components["schemas"]["AudienceCountsResponse"] | null
      dueDate: string | null
      id: string
      lesson: components["schemas"]["LessonOnDate"]

      publishedAt: string | null
      status: components["schemas"]["HomeworkStatus"]
      title: string
    }
    HomeworkListResponse: {
      archived: boolean
      audienceSize: number
      defaultLessonId: string | null
      items: components["schemas"]["HomeworkItemResponse"][]
      lessons: components["schemas"]["LessonOnDate"][]
      stage: components["schemas"]["StageSummary"]
      tabs: {
        archived: number
        draft: number
        published: number
      }
      today: string
    }
    WrittenHomeworkResponse: {
      id: string
      status: components["schemas"]["HomeworkStatus"]
      version: number
    }
    HomeworkDetailResponse: {
      archived: boolean
      audienceSize: number
      counts: components["schemas"]["AudienceCountsResponse"] | null
      dueDate: string | null
      id: string
      instructions: string | null
      lesson: {
        archived: boolean
        id: string
        memoryVerse: string | null
        passage: string | null
        teachingDate: string
        title: string
      }
      minDueDate: string

      publishedAt: string | null
      resources: {
        label: string
        url: string | null
      }[]
      service: components["schemas"]["ServiceReference"]
      stage: components["schemas"]["StageSummary"]
      status: components["schemas"]["HomeworkStatus"]
      title: string
      today: string
      version: number
    }
    ChangedHomeworkResponse: {
      id: string
      status: components["schemas"]["HomeworkStatus"]

      publishedAt: string | null

      archivedAt: string | null
      version: number
    }
    PersonReference: {
      id: string
      firstName: string
      lastName: string
      displayName: string | null
    }
    AudienceRowResponse: {
      completedAfterDueDate: boolean

      completedAt: string | null
      completedBy: components["schemas"]["AccountReference"] | null
      done: boolean
      inStage: boolean
      ownAccount: boolean
      parentAccounts: components["schemas"]["AccountReference"][]
      person: components["schemas"]["PersonReference"]
      reportedBySelf: boolean
    }
    HomeworkProgressResponse: {
      counts: components["schemas"]["AudienceCountsResponse"] | null
      homework: {
        counts: components["schemas"]["AudienceCountsResponse"] | null
        dueDate: string | null
        id: string
        instructions: string | null
        lesson: components["schemas"]["LessonOnDate"]

        publishedAt: string | null
        resources: {
          label: string
          url: string | null
        }[]
        status: components["schemas"]["HomeworkStatus"]
        title: string
      }
      lesson: components["schemas"]["LessonOnDate"]
      rows: components["schemas"]["AudienceRowResponse"][]
      service: components["schemas"]["ServiceReference"]
      stage: components["schemas"]["StageSummary"]
      today: string
    }
    LessonArchiveResponse: {
      id: string

      archivedAt: string | null
      homeworkArchived: number
      version: number
    }
    LessonHomework: {
      total: number
      published: number
      drafts: number
    }
    NoMeetingResponse: {
      date: string

      kind: "none"
    }
    OffScheduleMeetingResponse: {
      date: string

      kind: "not-on-schedule"
      title: string | null
    }
    PlannedMeetingResponse: {
      createdOn: string
      date: string

      kind: "planned"
      startTime: string
      title: string
    }

    SessionStatus: "scheduled" | "active" | "completed" | "canceled"
    SessionMeetingResponse: {
      cancelReason: string | null
      date: string
      endTime: string | null
      id: string

      kind: "session"
      location: string | null
      startTime: string
      status: components["schemas"]["SessionStatus"]
      title: string
    }

    LessonStatus: "draft" | "ready" | "completed"
    LessonDetailResponse: {
      archived: boolean
      homework: components["schemas"]["LessonHomework"]
      lesson: {
        activities: string | null

        archivedAt: string | null
        collaborators: components["schemas"]["AccountReference"][]

        completedAt: string | null
        id: string
        materials: {
          label: string
          url: string | null
        }[]
        meeting:
          | components["schemas"]["NoMeetingResponse"]
          | components["schemas"]["OffScheduleMeetingResponse"]
          | components["schemas"]["PlannedMeetingResponse"]
          | components["schemas"]["SessionMeetingResponse"]
        memoryVerse: string | null
        notes: string | null
        objectives: string | null
        passage: string | null
        responsible: components["schemas"]["AccountReference"] | null
        scheduleId: string | null
        status: components["schemas"]["LessonStatus"]
        summary: string | null
        teachingDate: string
        teachingPoints: string | null
        title: string
        version: number
      }
      service: components["schemas"]["ServiceReference"]
      stage: components["schemas"]["StageSummary"]
      today: string
    }
    WrittenLessonResponse: {
      id: string
      status: components["schemas"]["LessonStatus"]
      version: number
    }
    LessonReference: {
      id: string
      title: string
    }
    LessonOptionResponse: {
      date: string
      scheduleId: string
      startTime: string
      state: string
      takenBy: components["schemas"]["LessonReference"] | null
      title: string
    }
    LessonOptionsResponse: {
      today: string
      options: components["schemas"]["LessonOptionResponse"][]
      servants: components["schemas"]["AccountReference"][]
    }
    LessonRowResponse: {
      collaborators: components["schemas"]["AccountReference"][]
      homework: components["schemas"]["LessonHomework"]
      id: string
      meeting:
        | components["schemas"]["NoMeetingResponse"]
        | components["schemas"]["OffScheduleMeetingResponse"]
        | components["schemas"]["PlannedMeetingResponse"]
        | components["schemas"]["SessionMeetingResponse"]
      passage: string | null
      responsible: components["schemas"]["AccountReference"] | null
      status: components["schemas"]["LessonStatus"]
      teachingDate: string
      title: string
    }
    LessonListResponse: {
      archived: boolean
      items: components["schemas"]["LessonRowResponse"][]
      servants: components["schemas"]["AccountReference"][]
      service: components["schemas"]["ServiceReference"]
      stage: components["schemas"]["StageSummary"]
      tabs: {
        archived: number
        previous: number
        upcoming: number
      }
      today: string
    }
    LessonStatusResponse: {
      id: string
      status: components["schemas"]["LessonStatus"]

      completedAt: string | null
      version: number
    }
    ParentHomeworkItemResponse: {
      completedAt: string | null
      completedBy: string | null
      completedByYou: boolean
      done: boolean
      dueDate: string | null
      id: string
      lessonTitle: string
      stage: string | null
      title: string
    }
    ChildHomeworkListResponse: {
      today: string
      items: components["schemas"]["ParentHomeworkItemResponse"][]
    }
    MemberHomeworkDetailResponse: {
      lesson: {
        memoryVerse: string | null
        passage: string | null
        teachingDate: string
        title: string
      }
      task: {
        completedAt: string | null
        completedBy: string | null
        completedByYou: boolean
        done: boolean
        dueDate: string | null
        id: string
        instructions: string | null
        lessonTitle: string
        resources: {
          label: string
          url: string | null
        }[]
        stage: string | null
        title: string
      }
      today: string
    }
    ReportResultResponse: {
      completedAt: string
      completedBy: string | null
      completedByYou: boolean
      done: boolean
    }
    ChildHomeworkDetailResponse: {
      child: {
        id: string
        name: string
      }
      lesson: {
        memoryVerse: string | null
        passage: string | null
        teachingDate: string
        title: string
      }
      task: {
        completedAt: string | null
        completedBy: string | null
        completedByYou: boolean
        done: boolean
        dueDate: string | null
        id: string
        instructions: string | null
        lessonTitle: string
        resources: {
          label: string
          url: string | null
        }[]
        stage: string | null
        title: string
      }
      today: string
    }
    AttendanceCounts: {
      present: number
      rosterSize: number | null
      rosterPresent: number
      notMarked: number
      notOnRoster: number
    }

    RosterMode: "expected" | "open"
    AgendaSessionResponse: {
      cancelReason: string | null
      counts: components["schemas"]["AttendanceCounts"] | null
      date: string
      endTime: string | null

      endsAt: string | null
      id: string

      kind: "session"
      location: string | null
      occurrenceDate: string
      rosterMode: components["schemas"]["RosterMode"]
      scheduleId: string | null
      service: components["schemas"]["ServiceReference"] | null
      stage: components["schemas"]["StageReference"] | null
      startTime: string

      startsAt: string
      status: components["schemas"]["SessionStatus"]
      title: string
    }
    PlannedSessionResponse: {
      date: string
      endTime: string | null

      endsAt: string | null

      kind: "planned"
      location: string | null
      rosterMode: components["schemas"]["RosterMode"]
      scheduleId: string
      service: components["schemas"]["ServiceReference"] | null
      stage: components["schemas"]["StageReference"] | null
      startTime: string

      startsAt: string
      title: string
    }
    AgendaResponse: {
      today: string
      from: string
      to: string
      items: (
        | components["schemas"]["AgendaSessionResponse"]
        | components["schemas"]["PlannedSessionResponse"]
      )[]
    }
    MarkReference: {
      id: string

      recordedAt: string
    }
    VisitorRow: {
      person: components["schemas"]["PersonReference"]
      mark: components["schemas"]["MarkReference"]
      placements: components["schemas"]["PersonGroup"][]
    }
    BoardRow: {
      person: components["schemas"]["PersonReference"]
      mark: components["schemas"]["MarkReference"] | null
    }
    AttendanceBoardResponse: {
      counts: components["schemas"]["AttendanceCounts"]
      notOnRoster: components["schemas"]["VisitorRow"][]
      recentlyMarked: components["schemas"]["BoardRow"][]
      roster: components["schemas"]["BoardRow"][]
    }
    MarkHistory: {
      at: string | null
      by: components["schemas"]["AccountReference"] | null
    }
    Correction: {
      id: string
      person: components["schemas"]["PersonReference"]
      recorded: components["schemas"]["MarkHistory"]
      removed: components["schemas"]["MarkHistory"]
      reason: string | null
    }
    AttendanceCorrectionsResponse: {
      items: components["schemas"]["Correction"][]
    }
    MarkResponse: {
      id: string
      sessionId: string
      personId: string

      recordedAt: string
      recordedBy: components["schemas"]["AccountReference"] | null
    }
    SessionResponse: {
      cancelReason: string | null
      date: string
      endTime: string | null

      endsAt: string | null
      id: string
      location: string | null
      occurrenceDate: string
      rosterMode: components["schemas"]["RosterMode"]
      scheduleId: string | null
      service: components["schemas"]["ServiceReference"] | null
      stage: components["schemas"]["StageReference"] | null
      startTime: string

      startsAt: string
      status: components["schemas"]["SessionStatus"]
      title: string
    }
    SessionState: {
      id: string
      status: components["schemas"]["SessionStatus"]

      openedAt: string | null

      closedAt: string | null
      closedBy: components["schemas"]["AccountReference"] | null
    }
    AttendanceOverviewResponse: {
      closed: {
        session: components["schemas"]["SessionResponse"]
        state: components["schemas"]["SessionState"]
      }[]
      earlier: {
        session: components["schemas"]["SessionResponse"]
        state: components["schemas"]["SessionState"]
      }[]
      openCount: number
      sessions: {
        session: components["schemas"]["SessionResponse"]
        state: components["schemas"]["SessionState"]
      }[]
      today: string
    }
    CountedSession: {
      sessionId: string
      counts: components["schemas"]["AttendanceCounts"]
    }
    AttendanceCountsResponse: {
      items: components["schemas"]["CountedSession"][]
    }
    MemberMeetingResponse: {
      date: string
      endTime: string | null
      group: string
      key: string
      location: string | null
      service: components["schemas"]["ServiceReference"]
      startTime: string
      status: string
      title: string
    }
    MemberMeetingListResponse: {
      today: string
      from: string
      to: string
      items: components["schemas"]["MemberMeetingResponse"][]
    }
    WrittenScheduleResponse: {
      id: string
      createdSessions: number
    }
    UpcomingDate: {
      date: string
      startTime: string
      status: string
      sessionId: string | null
    }

    Frequency: "weekly" | "monthly"
    RecurrenceSummary: {
      frequency: components["schemas"]["Frequency"]
      interval: number
      weekdays: number[]
      monthWeek: number | null
      span: {
        endsOn: string | null
        startsOn: string
      }
    }
    ScheduleResponse: {
      active: boolean

      createdAt: string
      description: string | null
      endTime: string | null
      generating: boolean
      id: string
      location: string | null
      name: string
      nextDates: components["schemas"]["UpcomingDate"][]
      recurrence: components["schemas"]["RecurrenceSummary"]
      rosterMode: components["schemas"]["RosterMode"]
      rosterSize: number | null
      service: components["schemas"]["ServiceReference"] | null
      sessionCount: number
      stage: components["schemas"]["StageReference"] | null
      startTime: string

      updatedAt: string
    }
    DatedScheduleResponse: {
      today: string
      schedule: components["schemas"]["ScheduleResponse"]
    }
    ScheduleListResponse: {
      today: string
      items: components["schemas"]["ScheduleResponse"][]
    }
    CanceledOccurrenceResponse: {
      sessionId: string
    }
    ScheduleBrief: {
      id: string
      name: string
      recurrence: components["schemas"]["RecurrenceSummary"]
      active: boolean
    }

    SessionEventType: "created" | "opened" | "closed" | "reopened" | "canceled" | "edited"
    HistoryEntry: {
      type: components["schemas"]["SessionEventType"]

      at: string
      actor: components["schemas"]["AccountReference"] | null
      byGenerator: boolean
      note: string | null
    }
    SessionDetailResponse: {
      today: string
      session: components["schemas"]["SessionResponse"]
      state: components["schemas"]["SessionState"]
      schedule: components["schemas"]["ScheduleBrief"] | null
      history: components["schemas"]["HistoryEntry"][]
    }
    SessionStateResponse: {
      id: string
      status: components["schemas"]["SessionStatus"]

      openedAt: string | null

      closedAt: string | null
      closedBy: components["schemas"]["AccountReference"] | null
    }
    HistorySession: {
      id: string
      date: string

      startsAt: string
      present: number
    }
    HistoryRow: {
      person: components["schemas"]["PersonReference"]
      cells: string[]
      presentCount: number
    }
    AttendanceHistory: {
      today: string
      sessions: components["schemas"]["HistorySession"][]
      rows: components["schemas"]["HistoryRow"][]
    }
    ServiceResponse: {
      archived: boolean

      archivedAt: string | null
      description: string | null
      id: string
      memberCount: number
      name: string
      serviceLevelMemberCount: number
      stages: {
        id: string
        name: string
        position: number
      }[]
      tone: number
    }
    ServiceListResponse: {
      items: components["schemas"]["ServiceResponse"][]
    }
    StageListResponse: {
      archivedStages: {
        archivedAt: string | null
        id: string
        impact: components["schemas"]["ArchiveImpact"]
        name: string
      }[]
      service: components["schemas"]["ServiceReference"]
      stages: {
        description: string | null
        id: string
        impact: components["schemas"]["ArchiveImpact"]
        memberCount: number
        name: string
        position: number
      }[]
    }
    StageResponse: {
      archived: boolean
      description: string | null
      id: string
      memberCount: number
      name: string
      position: number
      service: components["schemas"]["ServiceReference"]
    }
    DirectoryEntry: {
      id: string
      firstName: string
      lastName: string
      displayName: string | null
      groups: components["schemas"]["PersonGroup"][]
    }
    DirectoryResponse: {
      items: components["schemas"]["DirectoryEntry"][]
    }
    ParentAccountView: {
      id: string
      name: string
      email: string
    }

    GuardianKind: "parent" | "guardian"
    ParentAccessItemResponse: {
      approvedAt: string
      approvedBy: components["schemas"]["AccountReference"] | null
      child: components["schemas"]["DirectoryEntry"]
      id: string
      parent: components["schemas"]["ParentAccountView"]
      relationship: components["schemas"]["GuardianKind"]
    }
    ParentAccessListResponse: {
      items: components["schemas"]["ParentAccessItemResponse"][]
      accounts: {
        email: string
        id: string
        name: string
      }[]
      today: string
    }
    LastLesson: {
      title: string
      teachingDate: string
      passage: string | null
      memoryVerse: string | null
    }
    MemberGroupResponse: {
      id: string
      lastLesson: components["schemas"]["LastLesson"] | null
      schedules: {
        endTime: string | null
        id: string
        location: string | null
        name: string
        recurrence: components["schemas"]["RecurrenceSummary"]
        startTime: string
      }[]
      service: components["schemas"]["ServiceReference"]
      since: string
      stage: components["schemas"]["StageSummary"] | null
    }
    MemberGroupListResponse: {
      today: string
      items: components["schemas"]["MemberGroupResponse"][]
    }
    AddedMembershipResponse: {
      endsOn: unknown
      id: string
      personId: string
      service: components["schemas"]["ServiceReference"]
      stage: components["schemas"]["StageReference"] | null
      startsOn: string
    }
    ChildSummaryResponse: {
      id: string
      name: string
      fullName: string
      initials: string
      stage: string | null
      service: string | null
      toDo: number
      done: number
    }
    ChildListResponse: {
      today: string
      items: components["schemas"]["ChildSummaryResponse"][]
    }

    PersonStatus: "active" | "inactive"
    PersonView: {
      id: string
      firstName: string
      lastName: string
      displayName: string | null
      status: components["schemas"]["PersonStatus"]
    }
    PlacementRow: {
      membershipId: string
      service: components["schemas"]["ServiceReference"]
      stage: components["schemas"]["StageReference"] | null
      startsOn: string
      endsOn: string | null
    }
    PersonRow: {
      person: components["schemas"]["PersonView"]
      placements: components["schemas"]["PlacementRow"][]
      pastPlacements: components["schemas"]["PlacementRow"][]
    }
    PeoplePageResponse: {
      items: components["schemas"]["PersonRow"][]
      page: number
      pageSize: number
      today: string
      total: number
    }
    MembershipView: {
      id: string
      serviceId: string
      stageId: string | null
      startsOn: string
      endsOn: string | null
    }
    CreatedPersonResponse: {
      person: components["schemas"]["PersonView"]
      membership: components["schemas"]["MembershipView"] | null
    }
    PersonResponse: {
      id: string
      firstName: string
      lastName: string
      displayName: string | null
      status: components["schemas"]["PersonStatus"]
    }
    Mention: {
      id: string
      where: string
      text: string
      date: string | null
      group: string | null
    }
    ErasureReviewResponse: {
      erase: {
        [key: string]: number
      }
      keep: {
        [key: string]: number
      }
      mentions: components["schemas"]["Mention"][]
    }

    RequestChannel: "app" | "email" | "letter" | "in_person"

    ErasedSubjectKind: "member" | "account"
    ErasedSubjectView: {
      kind: components["schemas"]["ErasedSubjectKind"]
      group: string | null
    }

    RequestKind: "erasure" | "copy"

    RequestStatus: "open" | "done" | "declined"
    DataRequestRowResponse: {
      channel: components["schemas"]["RequestChannel"]

      closedAt: string | null
      closedBy: components["schemas"]["AccountReference"] | null
      declineReason: string | null
      dueOn: string
      erasedSubject: components["schemas"]["ErasedSubjectView"] | null
      id: string
      kind: components["schemas"]["RequestKind"]
      note: string | null
      outcome: {
        [key: string]: number
      } | null

      receivedAt: string
      requestedBy: string
      status: components["schemas"]["RequestStatus"]
      subjectName: string | null
    }
    DataRequestListResponse: {
      today: string
      open: components["schemas"]["DataRequestRowResponse"][]
      closed: components["schemas"]["DataRequestRowResponse"][]
    }
    MembershipRow: {
      service: string | null
      stage: string | null
      from: string
      until: string | null
    }
    RequestMemberResponse: {
      displayName: string | null
      firstName: string
      id: string
      lastName: string
      memberships: components["schemas"]["MembershipRow"][]
      status: components["schemas"]["PersonStatus"]
    }
    RequestAccount: {
      id: string
      name: string
      email: string
      roles: string[]
    }
    DataRequestDetailResponse: {
      today: string
      request: components["schemas"]["DataRequestRowResponse"]
      member: components["schemas"]["RequestMemberResponse"] | null
      account: components["schemas"]["RequestAccount"] | null
    }
    PrivacyAcceptance: {
      at: string | null
      version: string | null
    }
    RegistrationView: {
      registeredAs: components["schemas"]["RegisteredAs"] | null
      note: string | null
    }

    GuardianStatus: "approved" | "revoked"
    LinkRow: {
      name: string | null
      linkStatus: components["schemas"]["GuardianStatus"]
    }
    ReportByRow: {
      homework: string
      child: string | null

      completedAt: string

      undoneAt: string | null
    }
    AttendanceRow: {
      meeting: string | null
      date: string | null

      markedPresentAt: string

      removedAt: string | null
      removalNote: string | null
    }
    ReportAboutRow: {
      homework: string

      completedAt: string

      undoneAt: string | null
    }
    MemberDataResponse: {
      attendance: components["schemas"]["AttendanceRow"][]

      exportedAt: string
      homeworkReports: components["schemas"]["ReportAboutRow"][]

      kind: "member"
      member: {
        displayName: string | null
        firstName: string
        id: string
        lastName: string
        recordedSince: string
        status: components["schemas"]["PersonStatus"]
      }
      memberships: components["schemas"]["MembershipRow"][]
      parentAccounts: components["schemas"]["LinkRow"][]
    }
    AccountDataResponse: {
      account: {
        approvedAt: string | null

        createdAt: string

        disabledAt: string | null
        email: string
        id: string
        language: components["schemas"]["Language"]
        memberAgeCheck: {
          parentAgreed: string | null
          result: components["schemas"]["AgeCheck"]
        } | null
        name: string
        privacyNoticeAccepted: components["schemas"]["PrivacyAcceptance"]
        registration: components["schemas"]["RegistrationView"] | null
        roles: string[]
      }
      children: components["schemas"]["LinkRow"][]

      exportedAt: string
      homeworkReports: components["schemas"]["ReportByRow"][]

      kind: "account"
      memberRecord: components["schemas"]["MemberDataResponse"] | null
    }
    OwnErasureRequest: {
      receivedAt: string
      dueOn: string
    }
    OwnErasureStatus: {
      erasureRequested: components["schemas"]["OwnErasureRequest"] | null
    }
    LivenessResponse: {
      status: string
    }
    ReadinessResponse: {
      status: string
      checks: {
        [key: string]: string
      }
    }
  }
  responses: {
    Problem: {
      headers: {
        [name: string]: unknown
      }
      content: {
        "application/problem+json": components["schemas"]["Problem"]
      }
    }
  }
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
  get_api_services_insights: {
    parameters: {
      query?: {
        status?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            items: components["schemas"]["ServiceInsight"][]
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_account_requests_list: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AccountRequestListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_account_requests_member_candidates: {
    parameters: {
      query?: {
        q?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MemberCandidateListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_account_requests_approve: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ApprovalRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AccountSummary"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_account_requests_decline: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_auth_email_confirmations: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ConfirmEmailRequest"]
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_auth_forgot_password: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ForgotPasswordRequest"]
      }
    }
    responses: {
      202: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            status: "received"
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_me: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MeResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_me_language: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ChangeLanguageRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MeResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_member_accounts_list: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MemberAccountListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_member_accounts_unlink: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_member_servants: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            items: components["schemas"]["GroupServant"][]
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_me_password: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ChangePasswordRequest"]
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_auth_password_links: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["SetPasswordFromLinkRequest"]
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_auth_register: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["RegisterAccountRequest"]
      }
    }
    responses: {
      202: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["RegistrationReceivedResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_auth_register_services: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["RegistrationServicesResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_roles_list: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["RoleListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_roles_create: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["RoleRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            id: string
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_roles_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["RoleDetailsResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_roles_edit: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["RoleRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["RoleDetailsResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_roles_delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_auth_sign_in: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": {
          email: string
          password: string
        }
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_auth_sign_out: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_staff_accounts: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StaffAccountList"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_account_roles_give: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["GiveAccountRoleRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            role: components["schemas"]["RoleSummary"]
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_account_roles_take: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
        roleId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_account_password_link: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["IssuedPasswordLink"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_auth_tokens: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": {
          email: string
          password: string
          deviceName?: string
        }
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            token: string
            expiresAt: string
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_auth_tokens_current: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_homework_list: {
    parameters: {
      query?: never
      header?: never
      path: {
        stageId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HomeworkListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_homework_create: {
    parameters: {
      query?: never
      header?: never
      path: {
        lessonId: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["HomeworkRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["WrittenHomeworkResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_homework_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HomeworkDetailResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_homework_edit: {
    parameters: {
      query?: {
        version?: number | null
      }
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["HomeworkRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["WrittenHomeworkResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_homework_delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_homework_publish: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ChangedHomeworkResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_homework_progress: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HomeworkProgressResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_homework_unpublish: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ChangedHomeworkResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_homework_archive: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ChangedHomeworkResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_homework_restore: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ChangedHomeworkResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_lessons_archive: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LessonArchiveResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_lessons_restore: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            id: string
            archivedAt: null
            version: number
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_lessons_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LessonDetailResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_lessons_edit: {
    parameters: {
      query?: {
        version?: number | null
      }
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["LessonRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["WrittenLessonResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_lessons_delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_lesson_options: {
    parameters: {
      query?: {
        lessonId?: string | null
      }
      header?: never
      path: {
        stageId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LessonOptionsResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_lessons_list: {
    parameters: {
      query?: {
        tab?: "upcoming" | "previous" | "archived"
        q?: string | null
      }
      header?: never
      path: {
        stageId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LessonListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_lessons_create: {
    parameters: {
      query?: never
      header?: never
      path: {
        stageId: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["LessonRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["WrittenLessonResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_lessons_status: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["LessonStatusRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LessonStatusResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_member_homework_list: {
    parameters: {
      query?: {
        state?: "todo" | "done"
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ChildHomeworkListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_member_homework_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        homeworkId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MemberHomeworkDetailResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_member_homework_report: {
    parameters: {
      query?: never
      header?: never
      path: {
        homeworkId: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ReportResultResponse"]
        }
      }

      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ReportResultResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_member_homework_undo: {
    parameters: {
      query?: never
      header?: never
      path: {
        homeworkId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_parent_homework_list: {
    parameters: {
      query?: {
        state?: "todo" | "done"
      }
      header?: never
      path: {
        childId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ChildHomeworkListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_parent_homework_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        childId: string
        homeworkId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ChildHomeworkDetailResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_parent_homework_report: {
    parameters: {
      query?: never
      header?: never
      path: {
        childId: string
        homeworkId: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ReportResultResponse"]
        }
      }

      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ReportResultResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_parent_homework_undo: {
    parameters: {
      query?: never
      header?: never
      path: {
        childId: string
        homeworkId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_agenda: {
    parameters: {
      query?: {
        from?: string | null
        to?: string | null
        serviceId?: string | null
        stageId?: string | null
        scheduleId?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AgendaResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_attendance_board: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AttendanceBoardResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_attendance_corrections: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AttendanceCorrectionsResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_attendance_mark: {
    parameters: {
      query?: never
      header?: never
      path: {
        sessionId: string
        personId: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MarkResponse"]
        }
      }

      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MarkResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_attendance_remove: {
    parameters: {
      query?: never
      header?: never
      path: {
        sessionId: string
        personId: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["RemovalRequest"]
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_attendance_overview: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AttendanceOverviewResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_attendance_counts: {
    parameters: {
      query?: {
        "sessionIds[]"?: string[]
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AttendanceCountsResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_dashboard_upcoming: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AgendaResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_member_meetings: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MemberMeetingListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_schedules_activate: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["WrittenScheduleResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_schedules_deactivate: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            id: string
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_schedules_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["DatedScheduleResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_schedules_edit: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ScheduleChangesRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["WrittenScheduleResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_schedules_delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_schedules_list: {
    parameters: {
      query?: {
        serviceId?: string | null
        stageId?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ScheduleListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_schedules_create: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateScheduleRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["WrittenScheduleResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_schedules_cancel_occurrence: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
        date: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ReasonRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CanceledOccurrenceResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_sessions_create: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["OneOffSessionRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            id: string
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_sessions_details: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["SessionDetailsRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            id: string
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_sessions_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionDetailResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_sessions_open: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionStateResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_sessions_close: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionStateResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_sessions_reopen: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ReasonRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionStateResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_sessions_cancel: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ReasonRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionStateResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_stages_attendance_history: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AttendanceHistory"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_service_leaders: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            items: components["schemas"]["AccountReference"][]
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_services_list: {
    parameters: {
      query?: {
        status?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ServiceListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_services_create: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ServiceRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ServiceResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_services_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ServiceResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_services_edit: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ServiceRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ServiceResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_services_delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_stages_list: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_stages_add: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["StageRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_stages_reorder: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["StageOrderRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_stages_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_stages_edit: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["StageRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  delete_api_stages_delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_services_archive: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ServiceResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_services_restore: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ServiceResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_stages_archive: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_stages_restore: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_people_directory: {
    parameters: {
      query?: {
        q?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["DirectoryResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_guardian_links_list: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ParentAccessListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_guardian_links_give: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ParentAccessRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ParentAccessItemResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_guardian_links_revoke: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_member_groups: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MemberGroupListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_people_memberships_add: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["PlacementRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AddedMembershipResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_memberships_move: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["MoveMembershipRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AddedMembershipResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_memberships_end: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_parent_children: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ChildListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_people_list: {
    parameters: {
      query?: {
        status?: "active" | "inactive" | "all"
        serviceId?: string | null
        stageId?: string | null
        q?: string
        page?: number
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["PeoplePageResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_people_create: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreatePersonRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CreatedPersonResponse"]
        }
      }

      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/problem+json": {
            status: number
            code: string
            params: Record<string, never>
            candidates: components["schemas"]["DirectoryEntry"][]
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  put_api_people_rename: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["RenamePersonRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["PersonResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_people_deactivate: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["PersonResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_people_reactivate: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": Record<string, never>
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["PersonResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_data_requests_erasure_review: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ErasureReviewResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_data_requests_erase: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["EraseRequestRequest"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["DataRequestRowResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_data_requests_list: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["DataRequestListResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_data_requests_record: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["RecordDataRequestRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": {
            id: string
          }
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_data_requests_show: {
    parameters: {
      query?: never
      header?: never
      path: {
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["DataRequestDetailResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_me_personal_data: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AccountDataResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_me_erasure_request: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["OwnErasureStatus"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  post_api_me_request_erasure: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["OwnErasureRequestRequest"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["OwnErasureRequest"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_health: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LivenessResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_health_ready: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ReadinessResponse"]
        }
      }

      503: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ReadinessResponse"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_openapi: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": Record<string, never>
        }
      }
      default: components["responses"]["Problem"]
    }
  }
}
