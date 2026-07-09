using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    public bool IsMovementPaused { get; private set; }

    public enum HeartState { Stable, Unstable, Danger, Frenzy }
    public HeartState CurrentHeartState { get; private set; } = HeartState.Stable;

    public int maxLives = 2;
    public int livesRemaining { get; private set; }

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
            return;
        }
    }

    private void Start()
    {
        livesRemaining = maxLives;
        CurrentHeartState = HeartState.Stable;
    }

    public void ToggleMovementPause()
    {
        IsMovementPaused = !IsMovementPaused;
    }

    public void SetHeartState(HeartState s)
    {
        CurrentHeartState = s;
        // TODO: broadcast UI changes, audio cues, etc.
    }

    public void OnBeatFail(string reason)
    {
        Debug.LogWarning("Beat fail: " + reason);
        livesRemaining = Mathf.Max(0, livesRemaining - 1);
        // brief feedback
        StartCoroutine(ScreenShakeRoutine());

        if (livesRemaining <= 0)
        {
            OnGameOver();
        }
    }

    private System.Collections.IEnumerator ScreenShakeRoutine()
    {
        // placeholder for screen shake, implement as needed
        yield return null;
    }

    private void OnGameOver()
    {
        IsMovementPaused = true;
        Debug.Log("Game Over");
        // TODO: show game over UI
    }
}
