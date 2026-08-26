import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { ExerciseTechnique } from "@/components/plan/exercise-technique";

describe("ExerciseTechnique", () => {
  it("renders an external Ver técnica link for https URLs", () => {
    render(
      <ExerciseTechnique loadmuscleUrl="https://www.loadmuscle.com/exercise/1" />,
    );

    const link = screen.getByRole("link", { name: /ver técnica/i });
    expect(link).toHaveAttribute(
      "href",
      "https://www.loadmuscle.com/exercise/1",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows Técnica pendiente when the URL is missing", () => {
    render(<ExerciseTechnique loadmuscleUrl={null} />);

    expect(screen.getByText(/técnica pendiente/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows Técnica pendiente for non-https URLs", () => {
    render(<ExerciseTechnique loadmuscleUrl="http://example.com/technique" />);

    expect(screen.getByText(/técnica pendiente/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
