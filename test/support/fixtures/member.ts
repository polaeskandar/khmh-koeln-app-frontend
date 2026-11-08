import type { MemberGroup } from "@/features/people/member/api"
import type { MemberMeeting } from "@/features/meetings/member/api"
import type { MemberTask } from "@/features/learning/member/api"
import type { Recurrence } from "@/lib/api/types/common"

const BIBLE_STUDY = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef101",
  name: "Bible Study",
  tone: 3,
  archived: false,
}

const COPTIC = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef102",
  name: "Coptic Language Course",
  tone: 5,
  archived: false,
}

const YOUTH = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef103",
  name: "Youth Meeting",
  tone: 2,
  archived: false,
}

const DEACONS = {
  id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef104",
  name: "Deacons’ School",
  tone: 6,
  archived: false,
}

const weekly = (weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7): Recurrence => ({
  frequency: "weekly",
  interval: 1,
  weekdays: [weekday],
  monthWeek: null,
  span: { startsOn: "2026-09-01", endsOn: null },
})

const stage = (id: string, name: string) => ({ id, name, position: 0, archived: false })

export const nevineGroups: MemberGroup[] = [
  {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef201",
    service: BIBLE_STUDY,
    stage: null,
    since: "2025-09-01",
    schedules: [
      {
        id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef301",
        name: "Bible Study",
        recurrence: weekly(5),
        startTime: "19:30",
        endTime: "21:00",
        location: "Hall",
      },
    ],
    servants: [
      { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef401", name: "Fr. Mina", role: "service_leader" },
    ],
    lastLesson: null,
  },
  {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef202",
    service: COPTIC,
    stage: stage("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef501", "Level 1"),
    since: "2026-09-01",
    schedules: [
      {
        id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef302",
        name: "Level 1 class",
        recurrence: weekly(1),
        startTime: "18:00",
        endTime: "19:00",
        location: "Room 2",
      },
    ],
    servants: [
      { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef402", name: "Irene Wahba", role: "service_leader" },
      { id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef403", name: "Youssef Nashed", role: "servant" },
    ],
    lastLesson: {
      title: "The first eight letters",
      teachingDate: "2026-11-02",
      passage: null,
      memoryVerse: "Ⲭⲣⲓⲥⲧⲟⲥ ⲁϥⲧⲱⲛϥ",
    },
  },
]

export const minaGroups: MemberGroup[] = [
  {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef203",
    service: DEACONS,
    stage: stage("0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef502", "Advanced"),
    since: "2025-09-01",
    schedules: [],
    servants: [],
    lastLesson: null,
  },
  {
    id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef204",
    service: YOUTH,
    stage: null,
    since: "2025-09-01",
    schedules: [],
    servants: [],
    lastLesson: null,
  },
]

const meeting = (
  key: string,
  date: string,
  group: string,
  title: string,
  service: MemberMeeting["service"],
  extra: Partial<MemberMeeting> = {}
): MemberMeeting => ({
  key,
  date,
  startTime: "18:00",
  endTime: "19:00",
  title,
  group,
  service,
  location: "Room 2",
  status: "scheduled",
  ...extra,
})

export const nevineMeetings: MemberMeeting[] = [
  meeting("m1", "2026-11-09", "Level 1", "Level 1 class", COPTIC),
  meeting("m2", "2026-11-11", "Bible Study", "Bible Study", BIBLE_STUDY, { status: "canceled" }),
  meeting("m3", "2026-11-13", "Bible Study", "Bible Study", BIBLE_STUDY, { status: "planned" }),
  meeting("m4", "2026-11-16", "Level 1", "Level 1 class", COPTIC, { status: "planned" }),
  meeting("m5", "2026-11-18", "Bible Study", "Bible Study", BIBLE_STUDY, { status: "planned" }),
  meeting("m6", "2026-11-20", "Bible Study", "Bible Study", BIBLE_STUDY, { status: "planned" }),
  meeting("m7", "2026-11-21", "Level 1", "Extra class", COPTIC, { status: "planned" }),
]

export const nevineHomework: { todo: MemberTask[]; done: MemberTask[] } = {
  todo: [
    {
      id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef601",
      title: "Write the first eight letters",
      lessonTitle: "The first eight letters",
      stage: "Level 1",
      dueDate: "2026-11-09",
      done: false,
      completedAt: null,
      completedByYou: false,
      completedBy: null,
    },
  ],
  done: [
    {
      id: "0192f3a4-7b1c-7d2e-8f3a-4b5c6d7ef602",
      title: "Say the Easter greeting at home",
      lessonTitle: "Greetings",
      stage: "Level 1",
      dueDate: "2026-11-02",
      done: true,
      completedAt: "2026-10-29T19:15:00Z",
      completedByYou: true,
      completedBy: "Nevine Boulos",
    },
  ],
}
