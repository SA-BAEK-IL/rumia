using UnityEngine;

[CreateAssetMenu(menuName = "ManualPacemaker/WaveData")]
public class WaveData : ScriptableObject
{
    public float bpm = 70f;
    public float duration = 20f;
    public WaveEvent[] events;
}

[System.Serializable]
public class WaveEvent
{
    public WaveEventType type;
    public float time;
    public float duration;
    public string prompt;
    public PatternType pattern;
    public float bpm;
}

public enum WaveEventType { Click, Drag, Hold, Pattern, Tempo }
public enum PatternType { LeftClick, RightClick, MiddleClick }
