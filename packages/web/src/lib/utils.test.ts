import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, cn } from "./utils"

describe("formatCurrency", () => {
  it("formats number as IDR currency", () => {
    const result = formatCurrency(1000000)
    expect(result).toContain("1.000.000")
    expect(result).toContain("Rp")
  })

  it("formats zero correctly", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0")
    expect(result).toContain("Rp")
  })

  it("formats large numbers", () => {
    const result = formatCurrency(10000000)
    expect(result).toContain("10.000.000")
    expect(result).toContain("Rp")
  })
})

describe("formatDate", () => {
  it("formats date string correctly", () => {
    const result = formatDate("2024-01-15T00:00:00Z")
    expect(result).toContain("2024")
  })
})

describe("cn", () => {
  it("combines class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("filters falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "inactive")).toBe("base active")
  })
})
