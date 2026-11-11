import { partialMatchKey, type QueryKey } from "@tanstack/react-query"

import {
  accountRequestsQuery,
  memberAccountsQuery,
  memberCandidatesQuery,
  staffAccountsQuery,
} from "@/features/identity/accounts/api"
import { meQuery, registrationServicesQuery } from "@/features/identity/auth/api"
import { roleQuery, rolesQuery } from "@/features/identity/roles/api"
import {
  homeworkProgressQuery,
  homeworkQuery,
  memberHomeworkQuery,
  memberTaskQuery,
  parentTaskQuery,
  stageHomeworkQuery,
} from "@/features/learning/homework/api"
import { lessonOptionsQuery, lessonQuery, stageLessonsQuery } from "@/features/learning/lessons/api"
import {
  attendanceBoardQuery,
  attendanceCorrectionsQuery,
  attendanceOverviewQuery,
  stageAttendanceHistoryQuery,
} from "@/features/meetings/attendance/api"
import { upcomingQuery } from "@/features/meetings/dashboard/api"
import {
  agendaQuery,
  meetingSessionQuery,
  memberMeetingsQuery,
  scheduleQuery,
  schedulesQuery,
  serviceSchedulesQuery,
} from "@/features/meetings/meetings/api"
import {
  serviceInsightsQuery,
  serviceQuery,
  serviceServantsQuery,
  servicesQuery,
  serviceStagesQuery,
} from "@/features/organization/services/api"
import { stageQuery } from "@/features/organization/stages/api"
import { parentChildrenQuery } from "@/features/people/children/api"
import { memberGroupsQuery } from "@/features/people/groups/api"
import { guardianLinksQuery } from "@/features/people/guardians/api"
import {
  directoryQuery,
  peopleQuery,
  type PersonRow,
  personRowQuery,
} from "@/features/people/members/api"
import {
  dataRequestQuery,
  dataRequestsQuery,
  erasureReviewQuery,
} from "@/features/privacy/data-requests/api"
import { erasureRequestQuery } from "@/features/privacy/own-data/api"

const person: PersonRow["person"] = {
  id: "p1",
  firstName: "Mina",
  lastName: "Fahmy",
  displayName: null,
  status: "active",
}

const QUERIES = {
  me: meQuery.queryKey,
  erasureRequest: erasureRequestQuery.queryKey,
  registrationServices: registrationServicesQuery.queryKey,
  accountRequests: accountRequestsQuery.queryKey,
  memberCandidates: memberCandidatesQuery("mi").queryKey,
  staffAccounts: staffAccountsQuery.queryKey,
  memberAccounts: memberAccountsQuery.queryKey,
  roles: rolesQuery.queryKey,
  role: roleQuery("r1").queryKey,
  services: servicesQuery.queryKey,
  serviceInsights: serviceInsightsQuery.queryKey,
  service: serviceQuery("s1").queryKey,
  serviceStages: serviceStagesQuery("s1").queryKey,
  serviceServants: serviceServantsQuery("s1").queryKey,
  stage: stageQuery("st1").queryKey,
  stageAttendanceHistory: stageAttendanceHistoryQuery("st1").queryKey,
  people: peopleQuery({ status: "active" }).queryKey,
  personRow: personRowQuery(person, 1).queryKey,
  directory: directoryQuery("mi").queryKey,
  guardianLinks: guardianLinksQuery.queryKey,
  parentChildren: parentChildrenQuery.queryKey,
  parentTask: parentTaskQuery("c1", "h1").queryKey,
  memberGroups: memberGroupsQuery.queryKey,
  memberMeetings: memberMeetingsQuery.queryKey,
  memberHomework: memberHomeworkQuery("todo").queryKey,
  memberTask: memberTaskQuery("h1").queryKey,
  schedules: schedulesQuery.queryKey,
  serviceSchedules: serviceSchedulesQuery("s1").queryKey,
  schedule: scheduleQuery("sc1").queryKey,
  agenda: agendaQuery({ serviceId: "s1" }).queryKey,
  session: meetingSessionQuery("se1").queryKey,
  attendanceOverview: attendanceOverviewQuery.queryKey,
  attendanceBoard: attendanceBoardQuery("se1").queryKey,
  attendanceCorrections: attendanceCorrectionsQuery("se1").queryKey,
  upcoming: upcomingQuery.queryKey,
  lesson: lessonQuery("l1").queryKey,
  stageLessons: stageLessonsQuery("st1").queryKey,
  lessonOptions: lessonOptionsQuery("st1").queryKey,
  stageHomework: stageHomeworkQuery("st1").queryKey,
  homework: homeworkQuery("h1").queryKey,
  homeworkProgress: homeworkProgressQuery("h1").queryKey,
  dataRequests: dataRequestsQuery.queryKey,
  dataRequest: dataRequestQuery("d1").queryKey,
  erasureReview: erasureReviewQuery("d1").queryKey,
} satisfies Record<string, QueryKey>

export function refetchedBy(changes: readonly QueryKey[]): string[] {
  return Object.entries(QUERIES)
    .filter(([, key]) => changes.some((prefix) => partialMatchKey(key, prefix)))
    .map(([name]) => name)
}
