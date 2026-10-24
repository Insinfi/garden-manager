import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("potager planner flow", () => {
  it("creates an area with keyboard placement and links a plant to it", async () => {
    let nextId = 0;
    vi.stubGlobal("crypto", { randomUUID: () => `test-${++nextId}` });
    render(<App />);

    expect(screen.getByText(/Mode local/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Plan" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Ajouter une zone/ })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: /Ajouter une zone/ }));
    fireEvent.change(screen.getByLabelText("Nom de la zone"), { target: { value: "Bac du fond" } });
    fireEvent.change(screen.getByLabelText("Largeur (m)"), { target: { value: "2.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer vers le plan" }));

    const map = screen.getByRole("group", { name: /Plan du jardin/ });
    await waitFor(() => expect(screen.getByRole("button", { name: /Emplacement provisoire de Bac du fond/ })).toBeInTheDocument());
    fireEvent.keyDown(map, { key: "ArrowRight" });
    expect(screen.getByText(/Emplacement : 1.5 m/)).toBeInTheDocument();
    fireEvent.keyDown(map, { key: "Enter" });

    await waitFor(() => expect(screen.getAllByText("Bac du fond").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: "Déplacer la zone" }));
    fireEvent.keyDown(map, { key: "ArrowDown" });
    expect(screen.getByText(/1.5 m depuis le haut/)).toBeInTheDocument();
    fireEvent.keyDown(map, { key: "Enter" });
    await waitFor(() => expect(screen.getByRole("button", { name: /Bac du fond, 2.5 mètres par 3 mètres, sélectionnée/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Déplacer la zone" }));
    fireEvent.keyDown(map, { key: "ArrowRight" });
    fireEvent.keyDown(map, { key: "Escape" });
    expect(screen.queryByRole("button", { name: /Nouvel emplacement de Bac du fond/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Déplacement annulé/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ajouter une plante ou un arbre/ }));
    fireEvent.change(screen.getByLabelText("Nom ou type"), { target: { value: "Fraisier" } });
    fireEvent.change(screen.getByLabelText("Date de plantation"), { target: { value: "2026-03-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer la plante" }));

    await waitFor(() => expect(screen.getByText("Fraisier")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Planning" }));
    fireEvent.click(screen.getByRole("button", { name: "Toutes les tâches" }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Modifier la tâche suggérée/ })).toHaveLength(5));
  });

  it("keeps a failed placement available for save retry", async () => {
    let nextId = 0;
    vi.stubGlobal("crypto", { randomUUID: () => `retry-${++nextId}` });
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("Disque indisponible");
    });
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Plan" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Ajouter une zone/ })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: /Ajouter une zone/ }));
    fireEvent.change(screen.getByLabelText("Nom de la zone"), { target: { value: "Carré des herbes" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer vers le plan" }));
    const map = screen.getByRole("group", { name: /Plan du jardin/ });
    fireEvent.keyDown(map, { key: "Enter" });

    expect(await screen.findByText("Disque indisponible")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Emplacement provisoire de Carré des herbes/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Emplacement provisoire de Carré des herbes/ })).not.toBeInTheDocument();
    });
    expect(screen.getAllByText("Carré des herbes").length).toBeGreaterThan(0);
  });
});
