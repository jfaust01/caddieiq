import { describe, expect, it } from "vitest"
import { mapSportsDataPlayer } from "../player/mapper"
import { mapSportsDataCourse } from "../course/mapper"
import { mapSportsDataTournament } from "../tournament/mapper"

describe("mapSportsDataPlayer", () => {
  it("translates fields and derives fullName + slug", () => {
    const player = mapSportsDataPlayer({
      PlayerID: 40000123,
      FirstName: "Rory",
      LastName: "McIlroy",
      Country: "Northern Ireland",
      PhotoUrl: "https://img/rory.png",
    })

    expect(player.firstName).toBe("Rory")
    expect(player.lastName).toBe("McIlroy")
    expect(player.fullName).toBe("Rory McIlroy")
    expect(player.slug).toBe("rory-mcilroy")
    expect(player.countryCode).toBe("Northern Ireland")
    expect(player.headshotUrl).toBe("https://img/rory.png")
    expect(player.handedness).toBe("UNKNOWN")
    expect(player.status).toBe("ACTIVE")
    expect(player.externalRef).toEqual({
      source: "sportsdataio",
      externalId: "40000123",
    })
  })

  it("falls back to the display name, then a placeholder", () => {
    expect(mapSportsDataPlayer({ PlayerID: 1, DraftKingsName: "J. Doe" }).fullName).toBe("J. Doe")
    expect(mapSportsDataPlayer({ PlayerID: 2 }).fullName).toBe("Unknown Player")
  })

  it("slugifies diacritics and coerces absent numerics to null", () => {
    const player = mapSportsDataPlayer({ PlayerID: 3, FirstName: "Sébastien", LastName: "Muñoz" })
    expect(player.slug).toBe("sebastien-munoz")
    expect(player.birthDate).toBeNull()
    expect(player.heightCm).toBeNull()
  })
})

describe("mapSportsDataCourse", () => {
  it("uses Venue as the course, maps State→stateProvince and Yards→yardage", () => {
    const course = mapSportsDataCourse({
      TournamentID: 55,
      Name: "The Masters",
      Venue: "Augusta National",
      City: "Augusta",
      State: "GA",
      Country: "USA",
      Par: 72,
      Yards: 7475,
    })

    // The course's identity is the venue, not the tournament name.
    expect(course.name).toBe("Augusta National")
    expect(course.slug).toBe("augusta-national")
    expect(course.stateProvince).toBe("GA")
    expect(course.yardage).toBe(7475)
    expect(course.par).toBe(72)
    // No upstream CourseID exists; identity is the deterministic slug.
    expect(course.externalRef.externalId).toBe("augusta-national")
  })

  it("parses city/state from free-text Location when structured fields are absent", () => {
    const course = mapSportsDataCourse({
      TournamentID: 56,
      Name: "AT&T Pebble Beach Pro-Am",
      Venue: "Pebble Beach Golf Links",
      Location: "Pebble Beach, CA",
    })

    expect(course.name).toBe("Pebble Beach Golf Links")
    expect(course.city).toBe("Pebble Beach")
    expect(course.stateProvince).toBe("CA")
  })

  it("does not mislabel an international locality segment as a US state", () => {
    const course = mapSportsDataCourse({
      TournamentID: 57,
      Name: "Irish Open",
      Venue: "Adare Manor",
      Location: "Adare, Ireland",
    })

    expect(course.city).toBe("Adare")
    // "Ireland" is not a 2-letter US state code, so it is left unset.
    expect(course.stateProvince).toBeNull()
  })

  it("uses a placeholder name when the venue is absent", () => {
    expect(mapSportsDataCourse({ TournamentID: 9 }).name).toBe("Unknown Course")
  })
})

describe("mapSportsDataTournament", () => {
  it("derives COMPLETED from IsOver and parses dates", () => {
    const t = mapSportsDataTournament({
      TournamentID: 700,
      Name: "The Masters",
      StartDate: "2024-04-11T00:00:00",
      EndDate: "2024-04-14T00:00:00",
      IsOver: true,
      Purse: 20000000,
    })

    expect(t.name).toBe("The Masters")
    expect(t.slug).toBe("the-masters")
    expect(t.status).toBe("COMPLETED")
    expect(t.format).toBe("STROKE_PLAY")
    expect(t.startDate).toBeInstanceOf(Date)
    expect(t.startDate?.getUTCFullYear()).toBe(2024)
    expect(t.purse).toBe(20000000)
    expect(t.officialName).toBeNull()
    expect(t.externalRef.externalId).toBe("700")
  })

  it("defaults to SCHEDULED when not over", () => {
    expect(mapSportsDataTournament({ TournamentID: 1, IsOver: false }).status).toBe("SCHEDULED")
    expect(mapSportsDataTournament({ TournamentID: 2 }).status).toBe("SCHEDULED")
  })
})
