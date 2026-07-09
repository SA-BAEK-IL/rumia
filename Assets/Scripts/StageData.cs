using UnityEngine;

[CreateAssetMenu(menuName = "Heartbeat/StageData")]
public class StageData : ScriptableObject
{
    public float baseBpm = 70f;
    public StageEvent[] events;
}

[System.Serializable]
public class StageEvent
{
    public float time; // seconds
    public StageEventType type;
    public float value; // duration/bpm etc.
    public string label;
}

public enum StageEventType { TempoChange, SpawnPattern, Dialog }
