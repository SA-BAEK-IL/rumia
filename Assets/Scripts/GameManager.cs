using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    public bool IsMovementPaused { get; private set; }

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
        }
    }

    public void ToggleMovementPause()
    {
        IsMovementPaused = !IsMovementPaused;
    }

    public void OnBeatFail(string reason)
    {
        Debug.LogError(reason);
        // TODO: 즉시 게임 오버 처리
    }
}
