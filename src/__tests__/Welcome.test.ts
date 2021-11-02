/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import Index from "../App.svelte";
import { render } from "@testing-library/svelte";

describe("Test if Jest is working", () => {
    test("Welcome", () => {
        const { getByText } = render(Index);
        expect(getByText("Welcome to Svelte")).toBeInTheDocument();
    });
});
