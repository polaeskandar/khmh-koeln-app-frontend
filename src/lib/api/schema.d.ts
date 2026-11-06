export type paths = {
  "/roles": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["pending_roles_list"]
    put?: never

    post: operations["pending_roles_create"]
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
      path: {
        id: string
      }
      cookie?: never
    }

    get: operations["pending_roles_show"]

    put: operations["pending_roles_update"]
    post?: never

    delete: operations["pending_roles_delete"]
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

    patch: operations["patch_api_me_update"]
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
    put?: never
    post?: never

    delete: operations["delete_api_homework_delete"]
    options?: never
    head?: never

    patch: operations["patch_api_homework_edit"]
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
    put?: never
    post?: never

    delete: operations["delete_api_lessons_delete"]
    options?: never
    head?: never

    patch: operations["patch_api_lessons_edit"]
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
  "/dashboard": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }

    get: operations["get_api_dashboard"]
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
    put?: never
    post?: never

    delete: operations["delete_api_schedules_delete"]
    options?: never
    head?: never

    patch: operations["patch_api_schedules_edit"]
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

    patch: operations["patch_api_sessions_rename"]
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
    put?: never
    post?: never

    delete: operations["delete_api_services_delete"]
    options?: never
    head?: never

    patch: operations["patch_api_services_edit"]
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
    put?: never
    post?: never

    delete: operations["delete_api_stages_delete"]
    options?: never
    head?: never

    patch: operations["patch_api_stages_edit"]
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
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never

    patch: operations["patch_api_people_rename"]
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
}
export type webhooks = Record<string, never>
export type components = {
  schemas: {
    RoleRow: {
      id: string
      name: string
      permissions: components["schemas"]["PermissionGrant"][]
      holderCount: number
    }
    RoleList: {
      items: components["schemas"]["RoleRow"][]
    }
    RoleInput: {
      name: string
      permissions: components["schemas"]["PermissionGrant"][]
    }
    RoleCreated: {
      id: string
    }
    RoleHolder: {
      id: string
      displayName: string
      email: string
      disabled: boolean
    }
    RoleDetail: {
      id: string
      name: string
      permissions: components["schemas"]["PermissionGrant"][]
      createdAt: string
      updatedAt: string
      holders: components["schemas"]["RoleHolder"][]
      onlyWayToChangeRoles: boolean
    }
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
    RemovalInput: {
      reason?: string | null
    }
    ConfirmEmailCommand: {
      token?: string | null
    }
    RequestPasswordResetCommand: {
      email?: string | null
    }
    SetPasswordFromLinkCommand: {
      token?: string | null

      password?: string | null
    }
    AccountInput: {
      firstName?: string | null

      lastName?: string | null

      email?: string | null

      password?: string | null

      language?: "en" | "de" | "ar" | null
    }
    RegistrationInput: {
      registeredAs?: "parent" | "servant" | "member" | null

      note?: string | null

      serviceIds?: string[]
    }
    PrivacyInput: {
      accepted?: boolean | null

      version?: string | null
    }
    RegisterAccountCommand: {
      account?: components["schemas"]["AccountInput"]

      registration?: components["schemas"]["RegistrationInput"]

      privacy?: components["schemas"]["PrivacyInput"]
    }
    ApprovalInput: {
      as?: "parent" | "servant" | "member" | null

      childIds?: string[]

      roleIds?: string[]
    }

    Language: "en" | "de" | "ar"
    ChangeLanguageCommand: {
      language?: components["schemas"]["Language"] | null
    }
    ChangePasswordCommand: {
      currentPassword?: string | null

      newPassword?: string | null
    }
    GiveAccountRoleCommand: {
      roleId?: string | null
    }
    HomeworkInput: {
      title?: string | null

      instructions?: string | null

      dueDate?: string | null

      resources?:
        | {
            [key: string]: string | null
          }[]
        | null
    }
    LessonOptionsInput: {
      lessonId?: string | null
    }
    LessonListInput: {
      tab?: "upcoming" | "previous" | "archived"

      q?: string | null
    }
    LessonDetailsInput: {
      title?: string | null

      summary?: string | null

      passage?: string | null

      memoryVerse?: string | null

      collaboratorIds?: string[] | null
    }
    LessonLinkInput: {
      scheduleId?: string | null

      sessionId?: string | null

      date?: string | null
    }
    LessonPlanInput: {
      objectives?: string | null

      teachingPoints?: string | null

      activities?: string | null

      notes?: string | null

      materials?:
        | {
            [key: string]: string | null
          }[]
        | null
    }
    LessonInput: {
      details?: components["schemas"]["LessonDetailsInput"]

      meeting?: components["schemas"]["LessonLinkInput"] | null

      plan?: components["schemas"]["LessonPlanInput"]

      responsibleId?: string | null

      status?: "draft" | "ready" | null
    }
    LessonStatusInput: {
      status?: "draft" | "ready" | "completed" | null
    }
    ShowAgendaQuery: {
      from?: string | null

      to?: string | null

      serviceId?: string | null

      stageId?: string | null

      scheduleId?: string | null
    }
    RosterInput: {
      serviceId?: string | null

      stageId?: string | null

      mode?: "expected" | "open" | null
    }
    DetailsInput: {
      name?: string | null

      description?: string | null

      location?: string | null
    }
    SpanInput: {
      startsOn?: string | null

      endsOn?: string | null
    }
    RecurrenceInput: {
      frequency?: "weekly" | "monthly" | null

      interval?: number | null

      weekdays?: number[]

      monthWeek?: number | null

      span?: components["schemas"]["SpanInput"]
    }
    TimesInput: {
      startTime?: string | null

      endTime?: string | null
    }
    CreateScheduleCommand: {
      roster?: components["schemas"]["RosterInput"]

      details?: components["schemas"]["DetailsInput"]

      recurrence?: components["schemas"]["RecurrenceInput"]

      times?: components["schemas"]["TimesInput"]
    }
    ScheduleChanges: {
      details?: components["schemas"]["DetailsInput"]

      recurrence?: components["schemas"]["RecurrenceInput"] | null

      times?: components["schemas"]["TimesInput"]

      rosterMode?: "expected" | "open" | null
    }
    ReasonInput: {
      reason?: string | null
    }
    OneOffInput: {
      roster?: components["schemas"]["RosterInput"]

      title?: string | null

      location?: string | null

      startsAt?: string | null

      endsAt?: string | null
    }
    SessionDetailsInput: {
      title?: string | null

      location?: string | null
    }
    ChildHomeworkInput: {
      state?: "todo" | "done"
    }
    CreateServiceCommand: {
      name?: string | null

      description?: string | null
    }
    ServiceChanges: {
      name?: string | null

      description?: string | null
    }
    ReorderStagesCommand: {
      stageIds?: string[] | null
    }
    StageChanges: {
      name?: string | null

      description?: string | null
    }
    ParentAccessInput: {
      userId?: string | null

      personId?: string | null

      relationship?: "parent" | "guardian"
    }
    PlacementInput: {
      serviceId?: string | null

      stageId?: string | null
    }
    MoveMembershipCommand: {
      stageId?: string | null
    }
    ListPeopleQuery: {
      status?: string

      serviceId?: string | null

      stageId?: string | null

      q?: string

      page?: number
    }
    CreatePersonCommand: {
      firstName?: string | null

      lastName?: string | null

      displayName?: string | null

      placement?: components["schemas"]["PlacementInput"] | null

      confirmDuplicate?: boolean
    }
    PersonChanges: {
      firstName?: string | null

      lastName?: string | null

      displayName?: string | null
    }
    RequestSubjectInput: {
      personId?: string | null

      accountId?: string | null
    }
    ReceiptInput: {
      requestedBy?: string | null

      channel?: "email" | "letter" | "in_person" | null

      receivedOn?: string | null
    }
    RecordDataRequestCommand: {
      kind?: "erasure" | "copy" | null

      subject?: components["schemas"]["RequestSubjectInput"]

      receipt?: components["schemas"]["ReceiptInput"]

      note?: string | null
    }
    EraseInput: {
      clearNotes?: boolean | null
    }
    RequestOwnErasureCommand: {
      note?: string | null
    }
    PersonRef: {
      id: string
      firstName: string
      lastName: string
      displayName: string | null
    }
    AccountRef: {
      id: string
      name: string
    }
    Correction: {
      id: string
      person: components["schemas"]["PersonRef"]
      reason: string | null
      recordedAt: string
      recordedBy: components["schemas"]["AccountRef"] | null
      removedAt: string
      removedBy: components["schemas"]["AccountRef"] | null
    }
    SessionCounts: {
      present: number
      rosterSize: number | null
      rosterPresent: number
      notMarked: number
      notOnRoster: number
    }

    SessionEventType: "created" | "opened" | "closed" | "reopened" | "canceled" | "edited"
    HistoryEntry: {
      actor: components["schemas"]["AccountRef"] | null
      at: string
      byGenerator: boolean
      note: string | null
      type: components["schemas"]["SessionEventType"]
    }
    MarkRef: {
      id: string
      recordedAt: string
      recordedBy: components["schemas"]["AccountRef"] | null
    }
    ServiceRef: {
      id: string
      name: string
      tone: number
      archived: boolean
    }
    StageRef: {
      id: string
      name: string
      position: number
      archived: boolean
    }
    PersonGroup: {
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"] | null
    }
    VisitorRow: {
      person: components["schemas"]["PersonRef"]
      mark: components["schemas"]["MarkRef"]
      placements: components["schemas"]["PersonGroup"][]
    }
    BoardRow: {
      person: components["schemas"]["PersonRef"]
      mark: components["schemas"]["MarkRef"] | null
    }

    RosterMode: "expected" | "open"

    SessionStatus: "scheduled" | "active" | "completed" | "canceled"
    BoardSession: {
      can: {
        manage: boolean
        record: boolean
        reopen: boolean
      }
      cancelReason: string | null
      closedAt: string | null
      closedBy: components["schemas"]["AccountRef"] | null
      date: string
      endTime: string | null
      endsAt: string | null
      id: string
      location: string | null
      occurrenceDate: string
      oneOff: boolean
      openedAt: string | null
      rosterMode: components["schemas"]["RosterMode"]
      scheduleId: string | null
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"] | null
      startTime: string
      startsAt: string
      status: components["schemas"]["SessionStatus"]
      title: string
    }
    AttendanceBoard: {
      corrections: components["schemas"]["Correction"][]
      counts: components["schemas"]["SessionCounts"]
      history: components["schemas"]["HistoryEntry"][]
      notOnRoster: components["schemas"]["VisitorRow"][]
      recentlyMarked: components["schemas"]["BoardRow"][]
      roster: components["schemas"]["BoardRow"][]
      session: components["schemas"]["BoardSession"]
      today: string
    }
    MarkView: {
      id: string
      sessionId: string
      personId: string
      recordedAt: string
      recordedBy: components["schemas"]["AccountRef"] | null
    }
    OverviewCard: {
      can: {
        manage: boolean
        record: boolean
        reopen: boolean
      }
      cancelReason: string | null
      closedAt: string | null
      closedBy: components["schemas"]["AccountRef"] | null
      counts: components["schemas"]["SessionCounts"]
      date: string
      endTime: string | null
      endsAt: string | null
      id: string
      location: string | null
      occurrenceDate: string
      oneOff: boolean
      openedAt: string | null
      rosterMode: components["schemas"]["RosterMode"]
      scheduleId: string | null
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"] | null
      startTime: string
      startsAt: string
      status: components["schemas"]["SessionStatus"]
      title: string
    }
    AttendanceOverview: {
      today: string
      sessions: components["schemas"]["OverviewCard"][]
      earlier: components["schemas"]["OverviewCard"][]
      closed: components["schemas"]["OverviewCard"][]
      openCount: number
    }
    HistorySession: {
      id: string
      date: string
      startsAt: string
      present: number
    }
    HistoryRow: {
      person: components["schemas"]["PersonRef"]
      cells: string[]
      presentCount: number
    }
    AttendanceHistory: {
      today: string
      sessions: components["schemas"]["HistorySession"][]
      rows: components["schemas"]["HistoryRow"][]
    }
    ServiceOption: {
      id: string
      name: string
    }
    Readiness: {
      status: string
      checks: {
        [key: string]: string
      }
    }
    AccountSummary: {
      id: string
      email: string
      displayName: string
      language: components["schemas"]["Language"]
    }

    RegisteredAs: "parent" | "servant" | "member"
    AccountRequest: {
      account: components["schemas"]["AccountSummary"]
      registeredAt: string
      registeredAs: components["schemas"]["RegisteredAs"] | null
      note: string | null
      services: components["schemas"]["ServiceRef"][]
    }
    RoleSummary: {
      id: string
      name: string
    }
    AccountRequests: {
      items: components["schemas"]["AccountRequest"][]
      roles: components["schemas"]["RoleSummary"][]
      today: string
    }
    MemberCandidate: {
      displayName: string | null
      firstName: string
      groups: components["schemas"]["PersonGroup"][]
      hasAccount: boolean
      id: string
      lastName: string
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
    PermissionGrant: {
      action: components["schemas"]["Action"]
      resource: components["schemas"]["Resource"]
    }
    MemberSummary: {
      personId: string
      groupCount: number
    }
    CurrentAccount: {
      account: components["schemas"]["AccountSummary"]
      roles: components["schemas"]["RoleSummary"][]
      permissions: components["schemas"]["PermissionGrant"][]
      today: string
      member: components["schemas"]["MemberSummary"] | null
    }

    AgeCheck: "sixteenOrOlder" | "guardianConsent"
    MemberAccountItem: {
      ageCheck: components["schemas"]["AgeCheck"] | null
      approvedAt: string | null
      approvedBy: components["schemas"]["AccountRef"] | null
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
    MemberAccounts: {
      items: components["schemas"]["MemberAccountItem"][]
      today: string
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
    PasswordLink: {
      expiresAt: string
    }
    AudienceCounts: {
      assigned: number
      completed: number
      completedAfterDueDate: number
      notCompleted: number
      reportedTotal: number
      withoutAccount: number
      withoutParentAccount: number
    }
    LessonRef: {
      id: string
      title: string
      teachingDate: string
    }

    HomeworkStatus: "draft" | "published" | "archived"
    HomeworkItem: {
      can: {
        archive: boolean
        delete: boolean
        edit: boolean
        publish: boolean
        restore: boolean
        unpublish: boolean
        viewProgress: boolean
      }
      counts: components["schemas"]["AudienceCounts"] | null
      dueDate: string | null
      id: string
      lesson: components["schemas"]["LessonRef"]
      publishedAt: string | null
      status: components["schemas"]["HomeworkStatus"]
      title: string
    }
    HomeworkList: {
      audienceSize: number
      can: {
        create: boolean
      }
      defaultLessonId: string | null
      items: components["schemas"]["HomeworkItem"][]
      lessons: components["schemas"]["LessonRef"][]
      stage: components["schemas"]["StageRef"]
      tabs: {
        [key: string]: number
      }
      today: string
    }
    HomeworkWritten: {
      id: string
      status: components["schemas"]["HomeworkStatus"]
      version: number
    }
    HomeworkDetail: {
      audienceSize: number
      can: {
        archive: boolean
        delete: boolean
        edit: boolean
        publish: boolean
        restore: boolean
        unpublish: boolean
        viewProgress: boolean
      }
      counts: components["schemas"]["AudienceCounts"] | null
      dueDate: string | null
      id: string
      instructions: string | null
      lesson: {
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
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"]
      status: components["schemas"]["HomeworkStatus"]
      title: string
      today: string
      version: number
    }
    HomeworkStatusChanged: {
      id: string
      status: components["schemas"]["HomeworkStatus"]
      publishedAt: string | null
      archivedAt: string | null
      version: number
    }
    AudienceRow: {
      completedAfterDueDate: boolean
      completedAt: string | null
      completedBy: components["schemas"]["AccountRef"] | null
      done: boolean
      inStage: boolean
      ownAccount: boolean
      parentAccounts: components["schemas"]["AccountRef"][]
      person: components["schemas"]["PersonRef"]
      reportedBySelf: boolean
    }
    HomeworkProgress: {
      counts: components["schemas"]["AudienceCounts"] | null
      homework: {
        can: {
          archive: boolean
          delete: boolean
          edit: boolean
          publish: boolean
          restore: boolean
          unpublish: boolean
          viewProgress: boolean
        }
        counts: components["schemas"]["AudienceCounts"] | null
        dueDate: string | null
        id: string
        instructions: string | null
        lesson: components["schemas"]["LessonRef"]
        publishedAt: string | null
        resources: {
          label: string
          url: string | null
        }[]
        status: components["schemas"]["HomeworkStatus"]
        title: string
      }
      lesson: components["schemas"]["LessonRef"]
      rows: components["schemas"]["AudienceRow"][]
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"]
      today: string
    }
    LessonArchived: {
      archivedAt: string | null
      homeworkArchived: number
      id: string
      version: number
    }
    LessonRestored: {
      archivedAt: unknown
      id: string
      version: number
    }
    MeetingView:
      | {
          kind: "none"
          date: string
        }
      | {
          kind: "planned"
          date: string
          startTime: string
          title: string
          createdOn: string
        }
      | {
          kind: "session"
          id: string
          status: components["schemas"]["SessionStatus"]
          date: string
          startTime: string
          endTime: string | null
          title: string
          location: string | null
          cancelReason: string | null
        }
      | {
          kind: "not-on-schedule"
          date: string
          title: string | null
        }

    LessonStatus: "draft" | "ready" | "completed"
    LessonView: {
      activities: string | null
      archivedAt: string | null
      collaborators: components["schemas"]["AccountRef"][]
      completedAt: string | null
      id: string
      materials: {
        label: string
        url: string | null
      }[]
      meeting: components["schemas"]["MeetingView"]
      memoryVerse: string | null
      notes: string | null
      objectives: string | null
      passage: string | null
      responsible: components["schemas"]["AccountRef"] | null
      scheduleId: string | null
      status: components["schemas"]["LessonStatus"]
      summary: string | null
      teachingDate: string
      teachingPoints: string | null
      title: string
      version: number
    }
    LessonDetail: {
      can: {
        archive: boolean
        delete: boolean
        manage: boolean
        manageHomework: boolean
        markCompleted: boolean
        restore: boolean
        viewNotes: boolean
      }
      homework: {
        drafts: number
        published: number
        total: number
      }
      lesson: components["schemas"]["LessonView"]
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"]
      today: string
    }
    LessonWritten: {
      id: string
      status: components["schemas"]["LessonStatus"]
      version: number
    }
    LessonOption: {
      date: string
      scheduleId: string
      startTime: string
      state: string
      takenBy: {
        id: string
        title: string
      } | null
      title: string
    }
    LessonOptions: {
      today: string
      options: components["schemas"]["LessonOption"][]
      servants: components["schemas"]["AccountRef"][]
    }
    LessonRow: {
      collaborators: components["schemas"]["AccountRef"][]
      homework: {
        drafts: number
        published: number
        total: number
      }
      id: string
      meeting: components["schemas"]["MeetingView"]
      passage: string | null
      responsible: components["schemas"]["AccountRef"] | null
      status: components["schemas"]["LessonStatus"]
      teachingDate: string
      title: string
    }
    LessonList: {
      can: {
        create: boolean
      }
      items: components["schemas"]["LessonRow"][]
      servants: components["schemas"]["AccountRef"][]
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"]
      tabs: {
        [key: string]: number
      }
      today: string
    }
    LessonStatusChanged: {
      completedAt: string | null
      id: string
      status: components["schemas"]["LessonStatus"]
      version: number
    }
    PlannedItem: {
      can: {
        manage: boolean
      }
      date: string
      endTime: string | null
      endsAt: string | null

      kind: "planned"
      location: string | null
      rosterMode: components["schemas"]["RosterMode"]
      scheduleId: string
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"] | null
      startTime: string
      startsAt: string
      title: string
    }
    SessionItem: {
      can: {
        manage: boolean
        record: boolean
        reopen: boolean
      }
      cancelReason: string | null
      counts: components["schemas"]["SessionCounts"] | null
      date: string
      endTime: string | null
      endsAt: string | null
      id: string

      kind: "session"
      location: string | null
      occurrenceDate: string
      oneOff: boolean
      rosterMode: components["schemas"]["RosterMode"]
      scheduleId: string | null
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"] | null
      startTime: string
      startsAt: string
      status: components["schemas"]["SessionStatus"]
      title: string
    }
    AgendaItem: components["schemas"]["PlannedItem"] | components["schemas"]["SessionItem"]
    Agenda: {
      today: string
      from: string
      to: string
      items: components["schemas"]["AgendaItem"][]
    }
    Dashboard: {
      today: string
      sessions: components["schemas"]["OverviewCard"][]
      upcoming: components["schemas"]["AgendaItem"][]
    }
    ScheduleActivated: {
      createdSessions: number
      id: string
    }
    ScheduleDeactivated: {
      id: string
    }
    PlannedDate: {
      date: string
      sessionId: string | null
      startTime: string
      status: string
    }

    Frequency: "weekly" | "monthly"
    RecurrenceView: {
      frequency: components["schemas"]["Frequency"]
      interval: number
      weekdays: number[]
      monthWeek: number | null
      span: {
        endsOn: string | null
        startsOn: string
      }
    }
    ScheduleSummary: {
      active: boolean
      can: {
        manage: boolean
      }
      createdAt: string
      description: string | null
      endTime: string | null
      generating: boolean
      id: string
      location: string | null
      name: string
      nextDates: components["schemas"]["PlannedDate"][]
      recurrence: components["schemas"]["RecurrenceView"]
      rosterMode: components["schemas"]["RosterMode"]
      rosterSize: number | null
      service: components["schemas"]["ServiceRef"]
      sessionCount: number
      stage: components["schemas"]["StageRef"] | null
      startTime: string
      updatedAt: string
    }
    ScheduleDetail: {
      today: string
      schedule: components["schemas"]["ScheduleSummary"]
    }
    ScheduleWritten: {
      id: string
      createdSessions: number
    }
    ScheduleList: {
      today: string
      items: components["schemas"]["ScheduleSummary"][]
    }
    CanceledOccurrence: {
      sessionId: string
    }
    SessionCreated: {
      id: string
    }
    SessionView: {
      can: {
        manage: boolean
        record: boolean
        reopen: boolean
      }
      cancelReason: string | null
      date: string
      endTime: string | null
      endsAt: string | null
      id: string
      location: string | null
      occurrenceDate: string
      oneOff: boolean
      rosterMode: components["schemas"]["RosterMode"]
      scheduleId: string | null
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"] | null
      startTime: string
      startsAt: string
      status: components["schemas"]["SessionStatus"]
      title: string
    }
    SessionDetail: {
      today: string
      session: components["schemas"]["SessionView"]
      schedule: {
        active: boolean
        id: string
        name: string
        recurrence: components["schemas"]["RecurrenceView"]
      } | null
      history: components["schemas"]["HistoryEntry"][]
    }
    SessionRenamed: {
      id: string
    }
    SessionState: {
      closedAt: string | null
      closedBy: components["schemas"]["AccountRef"] | null
      id: string
      openedAt: string | null
      status: components["schemas"]["SessionStatus"]
    }
    ParentHomeworkItem: {
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
    ChildHomeworkList: {
      today: string
      items: components["schemas"]["ParentHomeworkItem"][]
    }
    MemberHomeworkDetail: {
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
    ReportResult: {
      completedAt: string
      completedBy: string | null
      completedByYou: boolean
      done: boolean
    }
    MemberGroup: {
      id: string
      lastLesson: {
        memoryVerse: string | null
        passage: string | null
        teachingDate: string
        title: string
      } | null
      schedules: {
        endTime: string | null
        id: string
        location: string | null
        name: string
        recurrence: components["schemas"]["RecurrenceView"]
        startTime: string
      }[]
      servants: {
        id: string
        name: string
        role: string
      }[]
      service: components["schemas"]["ServiceRef"]
      since: string
      stage: components["schemas"]["StageRef"] | null
    }
    MemberGroups: {
      items: components["schemas"]["MemberGroup"][]
      today: string
    }
    MemberMeeting: {
      date: string
      endTime: string | null
      group: string
      key: string
      location: string | null
      service: components["schemas"]["ServiceRef"]
      startTime: string
      status: string
      title: string
    }
    MemberMeetings: {
      from: string
      items: components["schemas"]["MemberMeeting"][]
      to: string
      today: string
    }
    ServiceAbilities: {
      edit: boolean
      archive: boolean
      manageStructure: boolean
      manageSessions: boolean
      manageMembers: boolean
    }
    StructureImpact: {
      activeSchedules: number

      upcomingSessions: number
    }
    NextMeeting: {
      date: string
      startTime: string
      stage: components["schemas"]["StageRef"] | null
      status: string
    }
    AttendanceTrend: {
      sessions: number

      rate: number | null
      averagePresent: number | null
    }
    ServiceView: {
      archived: boolean
      archivedAt: string | null
      can: components["schemas"]["ServiceAbilities"]
      description: string | null
      id: string
      impact: components["schemas"]["StructureImpact"]
      leaders: components["schemas"]["AccountRef"][]
      memberCount: number
      name: string
      next: components["schemas"]["NextMeeting"] | null
      serviceLevelMemberCount: number
      stages: {
        archived: boolean
        can: {
          manageMembers: boolean
        }
        id: string
        name: string
        position: number
      }[]
      tone: number
      trend: components["schemas"]["AttendanceTrend"]
    }
    ServiceList: {
      items: components["schemas"]["ServiceView"][]
      can: {
        create: boolean
      }
    }
    StageList: {
      archivedStages: {
        archivedAt: string | null
        id: string
        impact: components["schemas"]["StructureImpact"]
        name: string
      }[]
      can: {
        manageStructure: boolean
      }
      service: components["schemas"]["ServiceRef"]
      stages: {
        description: string | null
        id: string
        impact: components["schemas"]["StructureImpact"]
        memberCount: number
        name: string
        position: number
      }[]
    }
    StageView: {
      archived: boolean
      can: {
        manageMembers: boolean
        manageStructure: boolean
      }
      description: string | null
      id: string
      memberCount: number
      name: string
      position: number
      service: components["schemas"]["ServiceRef"]
    }
    ChildSummary: {
      id: string
      name: string
      fullName: string
      initials: string
      stage: string | null
      service: string | null
      toDo: number
      done: number
    }
    ChildList: {
      today: string
      items: components["schemas"]["ChildSummary"][]
    }
    ChildHomeworkDetail: {
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
    DirectoryEntry: {
      displayName: string | null
      firstName: string
      groups: components["schemas"]["PersonGroup"][]
      id: string
      lastName: string
    }

    GuardianKind: "parent" | "guardian"
    ParentAccessItem: {
      approvedAt: string
      approvedBy: components["schemas"]["AccountRef"] | null
      child: components["schemas"]["DirectoryEntry"]
      id: string
      parent: {
        email: string
        id: string
        name: string
      }
      relationship: components["schemas"]["GuardianKind"]
    }
    ParentAccess: {
      accounts: {
        email: string
        id: string
        name: string
      }[]
      items: components["schemas"]["ParentAccessItem"][]
      today: string
    }
    AddedMembership: {
      endsOn: unknown
      id: string
      personId: string
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"] | null
      startsOn: string
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
      service: components["schemas"]["ServiceRef"]
      stage: components["schemas"]["StageRef"] | null
      startsOn: string
      endsOn: string | null
    }
    PersonRow: {
      person: components["schemas"]["PersonView"]
      placements: components["schemas"]["PlacementRow"][]
      pastPlacements: components["schemas"]["PlacementRow"][]
      can: {
        edit: boolean
      }
    }
    PeoplePage: {
      can: {
        add: boolean
      }
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
    CreatedPerson: {
      person: components["schemas"]["PersonView"]
      membership: components["schemas"]["MembershipView"] | null
    }

    RequestChannel: "app" | "email" | "letter" | "in_person"

    ErasedSubjectKind: "member" | "account"

    RequestKind: "erasure" | "copy"

    RequestStatus: "open" | "done" | "declined"
    DataRequestRow: {
      channel: components["schemas"]["RequestChannel"]
      closedAt: string | null
      closedBy: components["schemas"]["AccountRef"] | null
      declineReason: string | null
      dueOn: string
      erasedSubject: {
        group: string | null
        kind: components["schemas"]["ErasedSubjectKind"]
      } | null
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
    DataRequestList: {
      today: string
      open: components["schemas"]["DataRequestRow"][]
      closed: components["schemas"]["DataRequestRow"][]
    }
    Mention: {
      id: string
      where: string
      text: string
      date: string | null
      group: string | null
    }
    ExportRow: {
      [key: string]: boolean | string | null
    }
    DataRequestDetail: {
      today: string
      request: components["schemas"]["DataRequestRow"]
      can: {
        erase: boolean
      }
      inventory: {
        erase: {
          [key: string]: number
        }
        keep: {
          [key: string]: number
        }
        mentions: components["schemas"]["Mention"][]
      } | null
      member: {
        [key: string]: components["schemas"]["ExportRow"][] | string | null
      } | null
      account: {
        [key: string]: string[] | string
      } | null
    }
    PersonalData: {
      [key: string]: unknown
    }
    OwnErasureRequest: {
      receivedAt: string
      dueOn: string
    }
    OwnErasureStatus: {
      erasureRequested: components["schemas"]["OwnErasureRequest"] | null
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
  pending_roles_list: {
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
          "application/json": components["schemas"]["RoleList"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  pending_roles_create: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["RoleInput"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["RoleCreated"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  pending_roles_show: {
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
          "application/json": components["schemas"]["RoleDetail"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  pending_roles_update: {
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
        "application/json": components["schemas"]["RoleInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["RoleDetail"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  pending_roles_delete: {
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
          "application/json": components["schemas"]["AttendanceBoard"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["MarkView"]
        }
      }

      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["MarkView"]
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
        "application/json": components["schemas"]["RemovalInput"]
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
          "application/json": components["schemas"]["AttendanceOverview"]
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
  post_api_auth_email_confirmations: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ConfirmEmailCommand"]
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
        "application/json": components["schemas"]["RequestPasswordResetCommand"]
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
  post_api_auth_password_links: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["SetPasswordFromLinkCommand"]
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
        "application/json": components["schemas"]["RegisterAccountCommand"]
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
          "application/json": {
            items: components["schemas"]["ServiceOption"][]
          }
        }
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
          "application/json": components["schemas"]["Liveness"]
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
          "application/json": components["schemas"]["Readiness"]
        }
      }

      503: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["Readiness"]
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
          "application/json": components["schemas"]["AccountRequests"]
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
          "application/json": {
            items: components["schemas"]["MemberCandidate"][]
          }
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
        "application/json": components["schemas"]["ApprovalInput"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["CurrentAccount"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  patch_api_me_update: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ChangeLanguageCommand"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CurrentAccount"]
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
          "application/json": components["schemas"]["MemberAccounts"]
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
    requestBody?: {
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
  post_api_me_password: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ChangePasswordCommand"]
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
        "application/json": components["schemas"]["GiveAccountRoleCommand"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["PasswordLink"]
        }
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
          "application/json": components["schemas"]["HomeworkList"]
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
        "application/json": components["schemas"]["HomeworkInput"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HomeworkWritten"]
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
          "application/json": components["schemas"]["HomeworkDetail"]
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
  patch_api_homework_edit: {
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
        "application/json": components["schemas"]["HomeworkInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HomeworkWritten"]
        }
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
    requestBody?: {
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
          "application/json": components["schemas"]["HomeworkStatusChanged"]
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
          "application/json": components["schemas"]["HomeworkProgress"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["HomeworkStatusChanged"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["HomeworkStatusChanged"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["HomeworkStatusChanged"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["LessonArchived"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["LessonRestored"]
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
          "application/json": components["schemas"]["LessonDetail"]
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
  patch_api_lessons_edit: {
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
        "application/json": components["schemas"]["LessonInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LessonWritten"]
        }
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
          "application/json": components["schemas"]["LessonOptions"]
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
          "application/json": components["schemas"]["LessonList"]
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
        "application/json": components["schemas"]["LessonInput"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LessonWritten"]
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
        "application/json": components["schemas"]["LessonStatusInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["LessonStatusChanged"]
        }
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
          "application/json": components["schemas"]["Agenda"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  get_api_dashboard: {
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
          "application/json": components["schemas"]["Dashboard"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["ScheduleActivated"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["ScheduleDeactivated"]
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
          "application/json": components["schemas"]["ScheduleDetail"]
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
  patch_api_schedules_edit: {
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
        "application/json": components["schemas"]["ScheduleChanges"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ScheduleWritten"]
        }
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
          "application/json": components["schemas"]["ScheduleList"]
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
        "application/json": components["schemas"]["CreateScheduleCommand"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ScheduleWritten"]
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
        "application/json": components["schemas"]["ReasonInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CanceledOccurrence"]
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
        "application/json": components["schemas"]["OneOffInput"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionCreated"]
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
          "application/json": components["schemas"]["SessionDetail"]
        }
      }
      default: components["responses"]["Problem"]
    }
  }
  patch_api_sessions_rename: {
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
        "application/json": components["schemas"]["SessionDetailsInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionRenamed"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["SessionState"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["SessionState"]
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
        "application/json": components["schemas"]["ReasonInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionState"]
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
        "application/json": components["schemas"]["ReasonInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SessionState"]
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
          "application/json": components["schemas"]["ChildHomeworkList"]
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
          "application/json": components["schemas"]["MemberHomeworkDetail"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["ReportResult"]
        }
      }

      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ReportResult"]
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
          "application/json": components["schemas"]["MemberGroups"]
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
          "application/json": components["schemas"]["MemberMeetings"]
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
          "application/json": components["schemas"]["ServiceList"]
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
        "application/json": components["schemas"]["CreateServiceCommand"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ServiceView"]
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
          "application/json": components["schemas"]["ServiceView"]
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
  patch_api_services_edit: {
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
        "application/json": components["schemas"]["ServiceChanges"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ServiceView"]
        }
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
          "application/json": components["schemas"]["StageList"]
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
        "application/json": components["schemas"]["StageChanges"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageView"]
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
        "application/json": components["schemas"]["ReorderStagesCommand"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageList"]
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
          "application/json": components["schemas"]["StageView"]
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
  patch_api_stages_edit: {
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
        "application/json": components["schemas"]["StageChanges"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["StageView"]
        }
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
    requestBody?: {
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
          "application/json": components["schemas"]["ServiceView"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["ServiceView"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["StageView"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["StageView"]
        }
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
          "application/json": components["schemas"]["ChildList"]
        }
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
          "application/json": components["schemas"]["ChildHomeworkList"]
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
          "application/json": components["schemas"]["ChildHomeworkDetail"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["ReportResult"]
        }
      }

      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ReportResult"]
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
          "application/json": {
            items: components["schemas"]["DirectoryEntry"][]
          }
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
          "application/json": components["schemas"]["ParentAccess"]
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
        "application/json": components["schemas"]["ParentAccessInput"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ParentAccessItem"]
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
    requestBody?: {
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
        "application/json": components["schemas"]["PlacementInput"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AddedMembership"]
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
        "application/json": components["schemas"]["MoveMembershipCommand"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AddedMembership"]
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
    requestBody?: {
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
  get_api_people_list: {
    parameters: {
      query?: {
        status?: string
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
          "application/json": components["schemas"]["PeoplePage"]
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
        "application/json": components["schemas"]["CreatePersonCommand"]
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CreatedPerson"]
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
  patch_api_people_rename: {
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
        "application/json": components["schemas"]["PersonChanges"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["PersonView"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["PersonView"]
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
    requestBody?: {
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
          "application/json": components["schemas"]["PersonView"]
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
          "application/json": components["schemas"]["DataRequestList"]
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
        "application/json": components["schemas"]["RecordDataRequestCommand"]
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
          "application/json": components["schemas"]["DataRequestDetail"]
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
        "application/json": components["schemas"]["EraseInput"]
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["DataRequestRow"]
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
          "application/json": components["schemas"]["PersonalData"]
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
        "application/json": components["schemas"]["RequestOwnErasureCommand"]
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
}
